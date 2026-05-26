import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { CloseIcon, UploadIcon } from '../components/icons'
import { useAuth } from '../contexts/AuthContext'
import { generateStory } from '../lib/gemini'
import { getCurrentPosition, reverseGeocode } from '../lib/geocoding'
import { uploadPhotos } from '../hooks/useRecords'
import type { GeoPosition } from '../types'

interface CreateRecordScreenProps {
  onClose: () => void
  onSaved: () => void
  onSave: (payload: {
    photos: string[]
    memo: string | null
    story: string | null
    location_name: string | null
    latitude: number | null
    longitude: number | null
  }) => Promise<void>
}

interface PhotoItem {
  id: string
  file: File
  preview: string
}

export function CreateRecordScreen({ onClose, onSaved, onSave }: CreateRecordScreenProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [memo, setMemo] = useState('')
  const [story, setStory] = useState('')
  const [location, setLocation] = useState<GeoPosition | null>(null)
  const [locating, setLocating] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const pos = await getCurrentPosition()
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const locationName = await reverseGeocode(lat, lng)
        setLocation({ lat, lng, locationName })
      } catch {
        setLocation({ lat: 35.6812, lng: 139.7671, locationName: '位置情報を取得できませんでした' })
      } finally {
        setLocating(false)
      }
    })()
  }, [])

  const addPhotos = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (!files.length) return

      const remaining = 4 - photos.length
      const toAdd = files.slice(0, remaining)

      setPhotos((prev) => [
        ...prev,
        ...toAdd.map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
        })),
      ])
      e.target.value = ''
    },
    [photos.length],
  )

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.id !== id)
    })
  }, [])

  const handleGenerate = async () => {
    if (!photos.length) {
      setError('写真を1枚以上追加してください')
      return
    }
    setError(null)
    setGenerating(true)
    try {
      const text = await generateStory(
        photos.map((p) => p.file),
        location?.locationName ?? '不明な場所',
        memo,
      )
      setStory(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    if (!photos.length) {
      setError('写真を1枚以上追加してください')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const photoUrls = await uploadPhotos(
        user.id,
        photos.map((p) => p.file),
      )
      await onSave({
        photos: photoUrls,
        memo: memo || null,
        story: story || null,
        location_name: location?.locationName ?? null,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const shareToX = () => {
    const text = [story, location?.locationName].filter(Boolean).join('\n\n')
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-guilder-bg dark:bg-guilder-dark-bg">
      <header className="relative flex shrink-0 items-center justify-center border-b border-guilder-border px-4 py-4 dark:border-guilder-dark-border">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute left-4 rounded-lg p-1"
        >
          <CloseIcon />
        </button>
        <h1 className="text-lg font-bold">New Record</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-8">
        <div className="mb-6 flex items-start gap-2 text-sm">
          <span>📍</span>
          <span className="text-gray-600 dark:text-gray-300">
            {locating ? '現在地を取得中...' : location?.locationName}
          </span>
        </div>

        <section className="mb-6">
          <p className="mb-3 text-sm text-gray-500">Photos (1-4)</p>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative h-24 w-24">
                <img
                  src={photo.preview}
                  alt=""
                  className="h-full w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs text-white"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-guilder-border text-gray-400 dark:border-guilder-dark-border"
              >
                <UploadIcon className="mb-1 text-gray-400" />
                <span className="text-xs">Add Photo</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={addPhotos}
          />
        </section>

        <section className="mb-6">
          <label htmlFor="memo" className="mb-2 block text-sm text-gray-500">
            Memo (optional)
          </label>
          <textarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note about this moment..."
            rows={4}
            className="w-full resize-none rounded-xl border border-guilder-border bg-transparent px-4 py-3 text-sm outline-none focus:border-gold dark:border-guilder-dark-border"
          />
        </section>

        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">AI Story</span>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating}
              className="flex items-center gap-1 rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              ✦ {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Generate or write your story..."
            rows={5}
            className="w-full resize-none rounded-xl border border-guilder-border bg-transparent px-4 py-3 text-sm outline-none focus:border-gold dark:border-guilder-dark-border"
          />
        </section>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="w-full rounded-xl bg-gold py-3.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Record'}
          </button>
          <button
            type="button"
            onClick={shareToX}
            disabled={!story}
            className="w-full rounded-xl bg-black py-3.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            Share to X
          </button>
        </div>
      </div>
    </div>
  )
}

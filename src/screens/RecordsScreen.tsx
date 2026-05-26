import { CalendarIcon, MoonIcon, PinIcon, ShareIcon, SunIcon } from '../components/icons'
import { useTheme } from '../contexts/ThemeContext'
import type { Record } from '../types'

interface RecordsScreenProps {
  records: Record[]
  loading: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function shareRecord(record: Record) {
  const text = [record.story, record.location_name].filter(Boolean).join('\n\n')
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function RecordsScreen({ records, loading }: RecordsScreenProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="flex h-full flex-col overflow-hidden bg-guilder-bg dark:bg-guilder-dark-bg">
      <header className="flex shrink-0 items-start justify-between px-5 pb-2 pt-5">
        <div>
          <h1 className="text-2xl font-bold">My Journey</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {records.length} {records.length === 1 ? 'memory' : 'memories'} captured
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg p-2 hover:bg-guilder-card dark:hover:bg-guilder-dark-card"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-28 pt-2">
        {loading && (
          <p className="py-12 text-center text-sm text-gray-500">読み込み中...</p>
        )}

        {!loading && records.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-500 dark:text-gray-400">まだ記録がありません</p>
            <p className="mt-2 text-sm text-gray-400">+ ボタンから最初の記録を作成しましょう</p>
          </div>
        )}

        <div className="space-y-5">
          {records.map((record) => (
            <article
              key={record.id}
              className="overflow-hidden rounded-2xl border border-guilder-border bg-guilder-card dark:border-guilder-dark-border dark:bg-guilder-dark-card"
            >
              {record.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-0.5">
                  {record.photos.slice(0, 2).map((photo, i) => (
                    <img
                      key={`${record.id}-${i}`}
                      src={photo}
                      alt=""
                      className="h-[200px] w-full object-cover"
                    />
                  ))}
                  {record.photos.length === 1 && (
                    <div className="h-[200px] bg-guilder-border dark:bg-guilder-dark-border" />
                  )}
                </div>
              )}

              <div className="p-4">
                {record.story && (
                  <p className="mb-4 text-base leading-relaxed">{record.story}</p>
                )}

                <div className="mb-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {record.location_name && (
                    <span className="flex items-center gap-1">
                      <PinIcon className="text-gold" />
                      {record.location_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarIcon />
                    {formatDate(record.created_at)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => shareRecord(record)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-guilder-border py-3 text-sm font-medium text-gold dark:border-guilder-dark-border"
                >
                  <ShareIcon />
                  Share
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

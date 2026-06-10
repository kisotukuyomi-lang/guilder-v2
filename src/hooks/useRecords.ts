import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Record } from '../types'
import { useAuth } from '../contexts/AuthContext'

export function useRecords() {
  const { user } = useAuth()
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    if (!user) {
      setRecords([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch records:', error.message)
      setRecords([])
    } else {
      setRecords((data as Record[]) ?? [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    void fetchRecords()
  }, [fetchRecords])

  const createRecord = useCallback(
    async (payload: Omit<Record, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('Not authenticated')
      console.log('createRecord called', { payload, userId: user.id })
      const { data, error } = await supabase
        .from('records')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
      console.log('supabase result', { data, error })
      if (error) throw error
      await fetchRecords()
      return data as Record
    },
    [user, fetchRecords],
  )

  return { records, loading, fetchRecords, createRecord }
}

async function uploadPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('record-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    return dataUrl
  }

  const { data } = supabase.storage.from('record-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadPhotos(userId: string, files: File[]): Promise<string[]> {
  return Promise.all(files.map((f) => uploadPhoto(userId, f)))
}

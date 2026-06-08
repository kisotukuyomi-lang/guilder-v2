import { useCallback, useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TabBar, type TabId } from './components/TabBar'
import { useRecords } from './hooks/useRecords'
import { AuthScreen } from './screens/AuthScreen'
import { CreateRecordScreen } from './screens/CreateRecordScreen'
import { RecordsScreen } from './screens/RecordsScreen'

function AppShell() {
  const { user, loading } = useAuth()
  const { records, loading: recordsLoading, createRecord, fetchRecords } = useRecords()
  const [activeTab, setActiveTab] = useState<TabId>('records')
  const [showCreate, setShowCreate] = useState(false)

  const handleSave = useCallback(
    async (payload: {
      photos: string[]
      memo: string | null
      story: string | null
      location_name: string | null
      latitude: number | null
      longitude: number | null
      visibility: 'private' | 'guild' | 'public'
    }) => {
      await createRecord(payload)
    },
    [createRecord],
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  const content = (
    <>
      <main className="relative h-full overflow-hidden">
        <RecordsScreen records={records} loading={recordsLoading} />
      </main>

      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreate={() => setShowCreate(true)}
      />

      {showCreate && (
        <CreateRecordScreen
          onClose={() => setShowCreate(false)}
          onSaved={() => void fetchRecords()}
          onSave={handleSave}
        />
      )}
    </>
  )

  return content
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="mx-auto h-full max-w-lg">
          <AppShell />
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

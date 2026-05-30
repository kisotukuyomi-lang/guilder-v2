import { useCallback, useState } from 'react'
import { LoadScript } from '@react-google-maps/api'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TabBar, type TabId } from './components/TabBar'
import { useRecords } from './hooks/useRecords'
import { AuthScreen } from './screens/AuthScreen'
import { CreateRecordScreen } from './screens/CreateRecordScreen'
import { MapScreen } from './screens/MapScreen'
import { RecordsScreen } from './screens/RecordsScreen'

function AppShell() {
  const { user, loading, signOut } = useAuth()
  const { records, loading: recordsLoading, createRecord, fetchRecords } = useRecords()
  const [activeTab, setActiveTab] = useState<TabId>('map')
  const [showCreate, setShowCreate] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

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
        {activeTab === 'map' ? (
          <MapScreen
            records={records}
            onMenuClick={() => setMenuOpen(true)}
            hasMapsApiKey={Boolean(mapsApiKey)}
          />
        ) : (
          <RecordsScreen records={records} loading={recordsLoading} />
        )}
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

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="flex-1 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <aside className="w-64 bg-guilder-bg p-6 shadow-xl dark:bg-guilder-dark-bg">
            <h2 className="mb-6 text-lg font-bold tracking-[0.2em] text-gold">GUILDER</h2>
            <p className="mb-4 truncate text-sm text-gray-500">{user.email}</p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-xl border border-guilder-border py-2 text-sm dark:border-guilder-dark-border"
            >
              ログアウト
            </button>
          </aside>
        </div>
      )}
    </>
  )

  return mapsApiKey ? (
    <LoadScript
      id="guilder-google-map-script"
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
    >
      {content}
    </LoadScript>
  ) : (
    content
  )
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

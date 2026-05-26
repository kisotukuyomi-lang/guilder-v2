import { MapTabIcon, PlusIcon, RecordsTabIcon } from './icons'

export type TabId = 'map' | 'records'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  onCreate: () => void
}

export function TabBar({ activeTab, onTabChange, onCreate }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-guilder-border bg-guilder-bg pb-[env(safe-area-inset-bottom)] dark:border-guilder-dark-border dark:bg-guilder-dark-bg">
      <div className="relative mx-auto flex h-[72px] max-w-lg items-end justify-around px-6">
        <button
          type="button"
          onClick={() => onTabChange('map')}
          className={`mb-3 flex flex-col items-center gap-1 text-xs ${
            activeTab === 'map' ? 'text-gold' : 'text-gray-400'
          }`}
        >
          <MapTabIcon size={22} />
          <span>Map</span>
        </button>

        <button
          type="button"
          onClick={onCreate}
          aria-label="Create record"
          className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-white shadow-fab"
        >
          <PlusIcon size={28} />
        </button>

        <button
          type="button"
          onClick={() => onTabChange('records')}
          className={`mb-3 flex flex-col items-center gap-1 text-xs ${
            activeTab === 'records' ? 'text-gold' : 'text-gray-400'
          }`}
        >
          <RecordsTabIcon size={22} />
          <span>Records</span>
        </button>
      </div>
    </nav>
  )
}

import { useCallback, useMemo, useRef, useState } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { BottomSheet } from '../components/BottomSheet'
import { LocateIcon, MenuIcon, SearchIcon } from '../components/icons'
import { NEARBY_SPOTS } from '../data/nearbySpots'
import { useTheme } from '../contexts/ThemeContext'
import { darkMapStyle, lightMapStyle } from '../lib/mapStyles'
import type { Record } from '../types'

const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }

const goldPinIcon =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path fill="#C9A84C" stroke="#A8893A" stroke-width="1" d="M18 0C9.716 0 3 6.716 3 15c0 11.25 15 29 15 29s15-17.75 15-29C33 6.716 26.284 0 18 0zm0 22a7 7 0 110-14 7 7 0 010 14z"/></svg>',
  )

interface MapScreenProps {
  records: Record[]
  onMenuClick?: () => void
}

export function MapScreen({ records, onMenuClick }: MapScreenProps) {
  const { isDark } = useTheme()
  const mapRef = useRef<google.maps.Map | null>(null)
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const visitedMarkers = useMemo(
    () =>
      records.filter(
        (r) => r.latitude != null && r.longitude != null,
      ) as (Record & { latitude: number; longitude: number })[],
    [records],
  )

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const goToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCenter(next)
        mapRef.current?.panTo(next)
        mapRef.current?.setZoom(14)
      },
      () => {},
      { enableHighAccuracy: true },
    )
  }, [])

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-500">
        Google Maps API キーが設定されていません
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-guilder-bg/95 px-4 py-3 backdrop-blur dark:bg-guilder-dark-bg/95">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Menu"
          className="rounded-lg p-2 hover:bg-guilder-card dark:hover:bg-guilder-dark-card"
        >
          <MenuIcon />
        </button>
        <h1 className="text-lg font-bold tracking-[0.25em] text-gold">GUILDER</h1>
        <button
          type="button"
          aria-label="Search"
          className="rounded-lg p-2 hover:bg-guilder-card dark:hover:bg-guilder-dark-card"
        >
          <SearchIcon />
        </button>
      </header>

      <div className="absolute inset-0 pt-14">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={center}
          zoom={12}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: true,
            zoomControl: false,
            styles: isDark ? darkMapStyle : lightMapStyle,
          }}
        >
          {visitedMarkers.map((record) => (
            <Marker
              key={record.id}
              position={{ lat: record.latitude, lng: record.longitude }}
              icon={goldPinIcon}
              title={record.location_name ?? undefined}
            />
          ))}
        </GoogleMap>
      </div>

      <button
        type="button"
        onClick={goToCurrentLocation}
        aria-label="Current location"
        className="absolute bottom-[290px] right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-guilder-border bg-guilder-bg shadow-md dark:border-guilder-dark-border dark:bg-guilder-dark-card"
      >
        <LocateIcon />
      </button>

      <BottomSheet title="Nearby Spots">
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NEARBY_SPOTS.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => {
                setCenter({ lat: spot.lat, lng: spot.lng })
                mapRef.current?.panTo({ lat: spot.lat, lng: spot.lng })
                mapRef.current?.setZoom(15)
              }}
              className="w-[140px] shrink-0 text-left"
            >
              <img
                src={spot.image}
                alt={spot.name}
                className="mb-2 h-[100px] w-full rounded-xl object-cover"
              />
              <p className="truncate text-sm font-semibold">{spot.name}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{spot.name}</p>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

export interface Record {
  id: string
  user_id: string
  photos: string[]
  memo: string | null
  story: string | null
  location_name: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

export interface UserProfile {
  id: string
  email: string | null
  nickname: string | null
  avatar_url: string | null
  created_at: string
}

export interface NearbySpot {
  id: string
  name: string
  image: string
  lat: number
  lng: number
}

export interface GeoPosition {
  lat: number
  lng: number
  locationName: string
}

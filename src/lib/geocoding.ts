type GeocodingAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GeocodingResult = {
  formatted_address: string
  address_components: GeocodingAddressComponent[]
}

function pickComponent(
  components: GeocodingAddressComponent[],
  type: string,
): string | null {
  return components.find((c) => c.types.includes(type))?.long_name ?? null
}

function toJapanesePlaceName(result: GeocodingResult): string {
  const components = result.address_components
  const prefecture = pickComponent(components, 'administrative_area_level_1') ?? ''
  const city =
    pickComponent(components, 'locality') ??
    pickComponent(components, 'administrative_area_level_2') ??
    pickComponent(components, 'sublocality_level_1') ??
    ''

  const name = `${prefecture}${city}`.trim()
  return name || result.formatted_address
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim()
  if (!apiKey) return '現在地を特定できませんでした'

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('latlng', `${lat},${lng}`)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('language', 'ja')

    const res = await fetch(url.toString())
    const data = (await res.json()) as { results?: GeocodingResult[] }

    const topResult = data.results?.[0]
    if (!topResult) return '現在地を特定できませんでした'
    return toJapanesePlaceName(topResult)
  } catch {
    return '現在地を特定できませんでした'
  }
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    })
  })
}

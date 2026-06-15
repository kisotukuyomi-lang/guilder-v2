export type GenerateStyle = 'emotive' | 'affirming' | 'cool' | 'gossip'

export interface GenerateResult {
  title: string
  story: string
  hashtags: string[]
}

export async function generateStory(
  locationName: string | null,
  memo: string,
  style: GenerateStyle = 'emotive',
): Promise<GenerateResult> {
  const response = await fetch('/api/story-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationName, memo, style }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(JSON.stringify(err))
  }

  const data = await response.json()

  return {
    title: data.title ?? '',
    story: data.story ?? '',
    hashtags: data.hashtags ?? [],
  }
}

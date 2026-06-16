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
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationName, memo, style }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(JSON.stringify(err))
  }

  const data = await response.json()
  
  // result形式・title形式どちらでも対応
  if (data.title !== undefined) {
    return {
      title: data.title ?? '',
      story: data.story ?? '',
      hashtags: data.hashtags ?? [],
    }
  }
  
  // 古いresult形式のフォールバック
  const raw = data.result ?? ''
  const cleaned = raw.replace(/```json|```/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      title: parsed.title ?? '',
      story: parsed.story ?? '',
      hashtags: parsed.hashtags ?? [],
    }
  } catch {
    return { title: '', story: raw, hashtags: [] }
  }
}

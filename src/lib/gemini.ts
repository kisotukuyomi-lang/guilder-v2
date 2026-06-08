export async function generateStory(
  locationName: string,
  memo: string,
): Promise<string> {
  const response = await fetch('/api/generate-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationName, memo })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(JSON.stringify(err))
  }

  const data = await response.json()
  return data.result
}

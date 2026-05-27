export async function generateStory(
  locationName: string,
  memo: string,
  apiKey: string,
): Promise<string> {
  const prompt = `以下の情報をもとに、150〜250字の日本語で、その場所での体験を自然な文章で表現してください。SNSにシェアできる読みやすい文体にしてください。

場所：${locationName}
メモ：${memo || 'なし'}

文章のみを返してください。`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    },
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(JSON.stringify(error))
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '文章を生成できませんでした'
}

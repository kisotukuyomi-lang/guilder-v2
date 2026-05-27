async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function generateStory(
  photos: File[],
  locationName: string,
  memo: string,
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY')

  const imageParts = await Promise.all(
    photos.map(async (file) => ({
      inline_data: {
        mime_type: file.type || 'image/jpeg',
        data: await fileToBase64(file),
      },
    })),
  )

  const prompt = `あなたは旅行記録アプリ「GUILDER」のライターです。
以下の情報をもとに、感情豊かで詩的な日本語の旅行エッセイを1つ書いてください。

【場所】${locationName}
【メモ】${memo || '（なし）'}

要件：
- 150〜250字の日本語
- 一人称または三人称で自然な文体
- 写真の雰囲気と場所・メモを反映する
- 余計な見出しや箇条書きは使わない
- 本文のみを出力`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }, ...imageParts],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 512,
        },
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error('AI story generation returned empty result')
  return text
}

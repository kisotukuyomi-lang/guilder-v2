import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const { locationName, memo } = req.body as { locationName: string; memo: string }

  const prompt = `
あなたはライフログアプリ「GUILDER」のAIストーリーテラーです。
場所：${locationName}
メモ：${memo || 'なし'}
上記の情報をもとに、以下の形式でJSONのみを返してください：
{
  "title": "詩的で短いタイトル（20文字以内）",
  "story": "3文程度のエモい日記本文",
  "hashtags": ["タグ1", "タグ2", "タグ3"]
}
`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )
    const data = await response.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // コードブロックやMarkdownを除去
    const cleaned = raw.replace(/```json|```/g, '').trim()

    let parsed: { title?: string; story?: string; hashtags?: string[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return res.status(200).json({ result: raw })
    }

    const title = parsed.title ?? ''
    const story = parsed.story ?? ''
    const tags = (parsed.hashtags ?? []).join(' ')
    const result = `${title}\n\n${story}\n\n${tags}`

    return res.status(200).json({ result })
  } catch {
    return res.status(500).json({ error: 'Generation failed' })
  }
}

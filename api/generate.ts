import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = { runtime: 'nodejs' }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const { memo = '', locationName = '', style = 'emotive' } = req.body ?? {}

  const styleGuides: Record<string, string> = {
    emotive: 'エモい小説風。情景・感情・五感を盛り込む。一人称視点・過去形。',
    affirming: '自己肯定感を爆上げする応援風。ユーザーの行動を全力で褒める。',
    cool: 'クールでミニマルな一言日記風。事実だけで感情を伝える。短く鋭く。',
    gossip: '週刊誌の見出し・ゴシップ風。大げさでキャッチー。',
  }

  const location = locationName && locationName !== '現在地を特定できませんでした'
    ? `場所：${locationName}` : ''

  const prompt = `あなたはライフログアプリのAIです。以下の情報から記録を生成してください。

メモ：${memo || 'なし'}
${location}
文体：${styleGuides[style] ?? styleGuides.emotive}

ルール：
・タイトル15文字以内
・本文100〜200文字・2〜3文・過去形
・絵文字禁止
・ハッシュタグ3つ

必ずこのJSON形式のみで返してください（他の文字は一切不要）：
{"title":"タイトル","story":"本文","hashtags":["タグ1","タグ2","タグ3"]}`

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 512 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const cleaned = raw.replace(/```json|```/g, '').trim()

    let parsed: { title?: string; story?: string; hashtags?: string[] } = {}
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // パース失敗時はそのまま
    }

    return res.status(200).json({
      title: parsed.title ?? '',
      story: parsed.story ?? raw,
      hashtags: parsed.hashtags ?? [],
    })
  } catch {
    return res.status(500).json({ error: 'Generation failed' })
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node'

type Style = 'emotive' | 'affirming' | 'cool' | 'gossip'

function buildPrompt(
  memo: string,
  locationName: string | null,
  style: Style,
): string {
  const location = locationName && locationName !== '現在地を特定できませんでした'
    ? `場所：${locationName}`
    : ''

  const styleGuide: Record<Style, string> = {
    emotive: `
・文体：エモい小説風。情景・感情・五感を盛り込む
・一人称視点・過去形
・読んだ人が「わかる」と感じる普遍的な感情を入れる
・例：「光の角度が、いつもと少し違った気がした。」`,
    affirming: `
・文体：自己肯定感を爆上げする応援風
・ユーザーの行動・選択・努力を全力で褒める
・「あなたは今日も最高だった」という温かさ
・例：「その一歩が、確実に未来を変えている。」`,
    cool: `
・文体：クールでミニマルな一言日記風
・感情を直接書かず、事実だけで感情を伝える
・短く・鋭く・余韻を残す
・例：「80kgが、少し軽くなった。」`,
    gossip: `
・文体：週刊誌の見出し・ゴシップ風
・大げさ・キャッチー・思わず笑える
・例：「目撃！あの人物、またも限定スイーツに手を出す」`,
  }

  const categoryGuide = `
記録の種類を以下から自動判断して、文体をその種類に最適化してください：
・運動・トレーニング系（kg・走・泳・ジムなどのキーワード）→ 達成感・成長
・食事・カフェ系（食べ物・飲み物・カフェ・レストランなど）→ 体験・味・雰囲気
・旅行・外出系（場所名・移動・観光など）→ 情景・物語性
・学び・仕事系（本・勉強・会議・作業など）→ 気づき・成長
・日常系（その他全て）→ 温かく短い日記`

  return `
あなたはライフログアプリ「GUILDER」のAIストーリーテラーです。
ユーザーの記録を「後から見返したくなる文章」に仕上げてください。

【入力情報】
メモ：${memo || 'なし'}
${location}

【文体スタイル】
${styleGuide[style]}

【記録カテゴリの自動判断】
${categoryGuide}

【絶対に守るルール】
・出力は必ずJSON形式のみ。説明文・前置き・コードブロック不要
・タイトル：15文字以内・詩的・短く・その記録の核心を一言で
・本文：100〜200文字・2〜3文・過去形
・絵文字禁止
・「〜でした」「〜ました」の連続禁止（単調になるため）
・場所情報がある場合は自然に文脈に含める。ない場合は含めない
・ユーザーのメモにある具体的な数字・固有名詞は必ず反映する
・ハッシュタグは内容に即した具体的なもの（汎用的すぎるタグ禁止）

【出力形式】
{
  "title": "タイトル",
  "story": "本文",
  "hashtags": ["タグ1", "タグ2", "タグ3"]
}
`
}

export const config = { runtime: 'nodejs' }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const {
    locationName,
    memo,
    style = 'emotive',
  } = req.body as {
    locationName?: string
    memo?: string
    style?: Style
  }

  const prompt = buildPrompt(
    memo ?? '',
    locationName ?? null,
    style as Style,
  )

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 512,
          },
        }),
      },
    )

    const data = await response.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log('raw response:', raw)
    const cleaned = raw.replace(/```json|```/g, '').trim()

    let parsed: { title?: string; story?: string; hashtags?: string[] }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return res.status(200).json({ result: raw })
    }

    return res.status(200).json({
      title: parsed.title ?? '',
      story: parsed.story ?? '',
      hashtags: parsed.hashtags ?? [],
    })
  } catch {
    return res.status(500).json({ error: 'Generation failed' })
  }
}
// cache-bust: v2

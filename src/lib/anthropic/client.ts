const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL = 'gemini-2.5-flash'
const MAX_RETRIES = 3
const BASE_DELAY_MS = 600

function isRetryable(status: number): boolean {
  return status === 503 || status === 429 || status === 500
}

/**
 * Attempts to recover truncated JSON by closing any open structures.
 * Gemini truncates when maxOutputTokens is hit mid-response.
 */
function recoverTruncatedJson(text: string): string {
  // Strip markdown fences first
  let cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  // If it already parses, return it
  try { JSON.parse(cleaned); return cleaned } catch {}

  // Try closing open array then object
  const attempts = [
    cleaned + '"]}',,
    cleaned + '"]}',
    cleaned + '"}',
    cleaned + '}',
    cleaned + ']}',
  ]
  for (const attempt of attempts) {
    try { JSON.parse(attempt); return attempt } catch {}
  }

  return cleaned // return as-is, let caller handle the parse error
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const url = `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,  // was 1024 — was cutting off JSON mid-response
    },
  }

  let lastStatus = 0
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    lastStatus = res.status

    if (res.ok) {
      const data = await res.json()
      const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!raw) throw new Error('Empty response from Gemini')
      // Attempt JSON recovery in case of truncation
      return recoverTruncatedJson(raw)
    }

    const errBody = await res.text().catch(() => '')
    console.warn(`[gemini] attempt ${attempt + 1} failed HTTP ${res.status}:`, errBody.slice(0, 300))

    if (!isRetryable(res.status) || attempt === MAX_RETRIES - 1) {
      throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 300)}`)
    }
    await new Promise(r => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)))
  }
  throw new Error(`Gemini failed after ${MAX_RETRIES} attempts (last: ${lastStatus})`)
}

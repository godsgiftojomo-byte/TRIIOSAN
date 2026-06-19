/**
 * Gemini client for Triiosan.
 * SDK: @google/genai (the NEW SDK — @google/generative-ai is dead since Nov 2025)
 *
 * MODEL: gemini-2.5-flash
 * - Confirmed free-tier eligible in 2026.
 * - gemini-3.5-flash is NOT on the free tier → causes 503s constantly.
 * - gemini-3-flash-preview is free but unstable (50-70% 503 rate, April 2026).
 * - gemini-2.5-flash is the stable, free, recommended model for production.
 *
 * RETRY LOGIC: 503s are transient. We retry up to 3 times with exponential
 * backoff before giving up. Without this, every 503 silently falls back to
 * generic questions, making the AI look broken when it just needed a retry.
 */

import { GoogleGenAI } from '@google/genai'

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set')
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

const MODEL = 'gemini-2.5-flash'
const MAX_RETRIES = 3
const BASE_DELAY_MS = 600  // 600ms → 1.2s → 2.4s

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  // Retry on 503 (overloaded) and 429 (rate limit) — both are transient
  return msg.includes('503') || msg.includes('503 Service') ||
         msg.includes('UNAVAILABLE') || msg.includes('overloaded') ||
         msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')
}

/**
 * Calls Gemini with automatic retry on transient errors.
 * Returns the text response string.
 */
export async function generateWithGemini(prompt: string): Promise<string> {
  const ai = getClient()
  let lastErr: unknown

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      })

      const text = response.text
      if (!text) throw new Error('Empty response from Gemini')
      return text

    } catch (err) {
      lastErr = err
      const shouldRetry = isRetryable(err) && attempt < MAX_RETRIES - 1

      console.warn(
        `[gemini] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        err instanceof Error ? err.message : err,
        shouldRetry ? `— retrying in ${BASE_DELAY_MS * Math.pow(2, attempt)}ms` : '— giving up'
      )

      if (!shouldRetry) break

      // Exponential backoff: 600ms, 1200ms, 2400ms
      await new Promise(r => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt)))
    }
  }

  throw lastErr
}

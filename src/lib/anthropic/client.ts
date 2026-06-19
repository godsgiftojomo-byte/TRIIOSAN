import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Returns a Gemini GenerativeModel instance ready to call.
 * 
 * Using gemini-1.5-flash:
 * - Free tier: 15 requests/minute, 1,500 requests/day
 * - Fast, capable, well-suited for structured JSON output
 * - More generous free limits than Anthropic's free tier
 * 
 * To use a different Gemini model, change TRIAGE_MODEL below.
 * Options: 'gemini-1.5-flash' (free, fast), 'gemini-1.5-pro' (paid, more capable)
 */
export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. ' +
      'Add it to your Vercel project settings under Environment Variables. ' +
      'Get a free key at aistudio.google.com.'
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: TRIAGE_MODEL })
}

export const TRIAGE_MODEL = 'gemini-1.5-flash'

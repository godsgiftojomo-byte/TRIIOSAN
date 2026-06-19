/**
 * Gemini client for Triiosan triage AI.
 *
 * NOTE: This file is named "anthropic/client" for historical reasons
 * (the lib folder was originally set up for Anthropic and later pivoted to Gemini).
 * It uses the Google Generative AI SDK (@google/generative-ai).
 *
 * Model: gemini-1.5-flash-latest
 *   - "gemini-pro" and "gemini-1.0-pro" are deprecated and return 404.
 *   - "gemini-1.5-flash" is the current recommended free-tier model.
 *   - "gemini-1.5-flash-latest" always resolves to the stable latest version.
 *
 * If you see 404 errors in Google AI Studio, the model name was wrong.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Returns a GenerativeModel instance configured for Triiosan triage use cases.
 * Uses gemini-1.5-flash-latest — fast, capable, and available on the free tier.
 */
export function getGeminiModel() {
  const client = getClient()
  return client.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    generationConfig: {
      temperature: 0.3,      // Low temperature for consistent clinical responses
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  })
}

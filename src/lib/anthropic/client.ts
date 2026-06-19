/**
 * Gemini client for Triiosan — uses the NEW @google/genai SDK.
 *
 * THE OLD SDK (@google/generative-ai) IS DEAD:
 *   - Deprecated Nov 2024, all support ended Nov 30, 2025.
 *   - v1beta API endpoint it calls no longer reliably serves models.
 *   - This is why every request returned 404 NotFound.
 *
 * THE NEW SDK (@google/genai):
 *   - package: @google/genai
 *   - import: { GoogleGenAI } from "@google/genai"
 *   - Completely different API surface (client.models.generateContent vs model.generateContent)
 *
 * MODEL: gemini-3.5-flash
 *   - Released May 19, 2026. No shutdown date. Current recommended free-tier model.
 *   - gemini-2.5-flash shuts down Oct 16, 2026.
 *   - gemini-2.0-flash SHUT DOWN June 1, 2026 — already dead.
 *   - gemini-1.5-flash — dead, returns 404 on v1beta.
 */

import { GoogleGenAI } from '@google/genai'

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

/**
 * Calls Gemini and returns the text response.
 * Replaces the old model.generateContent() pattern entirely.
 *
 * Usage:
 *   const text = await generateWithGemini(prompt)
 */
export async function generateWithGemini(prompt: string): Promise<string> {
  const ai = getClient()

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  })

  const text = response.text
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

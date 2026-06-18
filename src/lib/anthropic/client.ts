import Anthropic from '@anthropic-ai/sdk'

/**
 * Creates a fresh Anthropic client per call.
 * 
 * NOTE: We intentionally do NOT cache this as a module-level singleton.
 * In Vercel's serverless environment each function invocation may get
 * a fresh module context, making the singleton pattern unreliable and
 * sometimes causing the API key to not be picked up correctly.
 * Creating a new client per request is cheap and reliable.
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is not set. ' +
      'Add it to your Vercel project settings under Environment Variables.'
    )
  }

  return new Anthropic({ apiKey })
}

export const TRIAGE_MODEL = 'claude-sonnet-4-6'

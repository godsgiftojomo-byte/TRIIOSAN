import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Stateless, signed admin session tokens.
 *
 * Why not an in-memory Set? On Vercel, each API route runs as its own
 * serverless function instance. A token added to a Set inside one
 * function's process is invisible to every other function (and to
 * future cold starts of the same one) — so admin/users and admin/stats
 * would almost never see a token that admin/login just issued.
 *
 * Instead, the token itself carries proof of its own validity: a
 * base64 payload (containing the expiry) plus an HMAC-SHA256 signature
 * over that payload, keyed with a server-only secret. Any instance can
 * verify a token on its own, with no shared state and no database call.
 */

const SECRET = process.env.ADMIN_TOKEN_SECRET

function getSecret(): string {
  if (!SECRET) {
    // Fail loudly at request time rather than silently minting unverifiable
    // tokens — this should be caught in env setup, not in production traffic.
    throw new Error(
      'ADMIN_TOKEN_SECRET is not set. Add it to your environment variables ' +
      '(Vercel project settings or .env.local).'
    )
  }
  return SECRET
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

/**
 * Issue a new admin session token, valid for the given duration.
 */
export function issueAdminToken(durationMs = 8 * 60 * 60 * 1000): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + durationMs })
  ).toString('base64url')

  const signature = sign(payload)
  return `${payload}.${signature}`
}

/**
 * Verify an admin session token. Returns true only if the signature is
 * valid AND the token has not expired.
 */
export function validateAdminToken(token: string | undefined): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, signature] = parts

  let expectedSignature: string
  try {
    expectedSignature = sign(payload)
  } catch {
    return false
  }

  // Constant-time comparison to avoid leaking signature info via timing.
  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expectedSignature)
  if (sigBuf.length !== expectedBuf.length) return false
  if (!timingSafeEqual(sigBuf, expectedBuf)) return false

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof decoded.exp !== 'number') return false
    return Date.now() < decoded.exp
  } catch {
    return false
  }
}

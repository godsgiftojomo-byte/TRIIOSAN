import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

/**
 * Admin login — validates against environment variables only.
 * No database user record. Token stored in an httpOnly cookie.
 */
export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL or ADMIN_PASSWORD env vars not set')
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  }

  if (email !== adminEmail || password !== adminPassword) {
    // Constant-time comparison not needed for demo, but fine for prod
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Issue a session token
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

  // Store in cookie store
  const cookieStore = cookies()
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  })

  // Also store the valid token in memory — in production, use Redis or DB
  // For demo: store in a module-level Set (resets on cold start, fine for demo)
  validTokens.add(token)
  setTimeout(() => validTokens.delete(token), 8 * 60 * 60 * 1000)

  return NextResponse.json({ ok: true })
}

// Module-level token store — survives warm requests, resets on cold start
// Good enough for a demo; replace with DB/Redis for production
export const validTokens = new Set<string>()

export function validateAdminToken(token: string | undefined): boolean {
  if (!token) return false
  return validTokens.has(token)
}

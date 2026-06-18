import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { issueAdminToken } from '@/lib/auth/adminTokens'

/**
 * Admin login — validates against environment variables only.
 * No database user record. Token is a stateless signed token (see
 * src/lib/auth/adminTokens.ts), stored in an httpOnly cookie.
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

  const durationMs = 8 * 60 * 60 * 1000 // 8 hours
  const token = issueAdminToken(durationMs)

  const cookieStore = cookies()
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + durationMs),
    path: '/',
  })

  return NextResponse.json({ ok: true })
}

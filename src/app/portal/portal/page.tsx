// triiosan-batch3 marker: https://triiosan.dev/b3/portal-login
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/AuthShell'

export default function ClinicianPortalPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !data.user) {
      setError('Invalid credentials. Please try again.')
      setLoading(false)
      return
    }

    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role !== 'clinician') {
      await supabase.auth.signOut()
      setError('This portal is for clinicians only.')
      setLoading(false)
      return
    }

    router.push('/clinician')
  }

  return (
    <AuthShell variant="clinician" label="Clinician portal">
      <h1 className="mb-5 font-display text-xl font-extrabold text-dark-text">
        Sign in to your account
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-dark-muted">
            Email address
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="input"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-dark-muted">
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
              className="input pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-xl bg-urgency-emergency-dark-bg p-3 text-sm text-urgency-emergency">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-accent mt-2 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-dark-muted">
        Not a clinician?{' '}
        <Link href="/login" className="font-semibold text-marigold hover:text-marigold-dark">
          Patient login
        </Link>
      </p>
    </AuthShell>
  )
}

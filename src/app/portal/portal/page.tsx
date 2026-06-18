'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, Stethoscope } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Wordmark } from '@/components/Wordmark'

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

    const { data: profile } = await supabase
      .from('profiles')
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
    <div className="flex min-h-screen flex-col bg-dark-bg">
      {/* Pattern hero strip — inverted */}
      <div className="pattern-overlay pattern-strong h-2 bg-ember" />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Wordmark className="justify-center" />
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-dark-border bg-dark-card px-3 py-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-ember" />
              <span className="text-xs font-semibold text-dark-muted">Clinician Portal</span>
            </div>
          </div>

          <div className="rounded-2xl border border-dark-border bg-dark-card p-6 shadow-card-dark">
            <h1 className="font-display text-lg font-extrabold text-dark-text mb-1">
              Clinician sign in
            </h1>
            <p className="text-sm text-dark-muted mb-5">
              Access your patient queue and case reviews.
            </p>

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
                  placeholder="doctor@hospital.ng"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text"
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

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in to portal'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-dark-muted">
              No account yet?{' '}
              <Link href="/portal/signup" className="font-semibold text-ember hover:text-ember-dark">
                Request access
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-dark-muted/60">
            Patient? <Link href="/login" className="text-ember/70 hover:text-ember">Go to patient portal</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

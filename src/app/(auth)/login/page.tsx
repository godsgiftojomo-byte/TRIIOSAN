'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Wordmark } from '@/components/Wordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { UserRole } from '@/lib/supabase/types'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const supabase = createClient()

  const roleHint = searchParams.get('role')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !data.user) {
      setError(signInError?.message || t('auth.error.generic'))
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    const role = (profile as { role: UserRole } | null)?.role

    if (role === 'clinician') {
      router.push('/clinician')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen px-6 py-5 sm:px-10">
      <header className="mb-8 flex items-center justify-between">
        <Link href="/">
          <Wordmark />
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto max-w-md">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {t('auth.login')}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink/80">
              {t('auth.email')}
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink/80">
              {t('auth.password')}
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-urgency-emergency-bg p-3 text-sm text-urgency-emergency">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('auth.loginCta')}
          </button>

          <p className="text-center text-sm text-ink/60">
            {t('auth.noAccount')}{' '}
            <Link
              href={`/signup${roleHint ? `?role=${roleHint}` : ''}`}
              className="font-semibold text-ember"
            >
              {t('auth.signupCta')}
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}

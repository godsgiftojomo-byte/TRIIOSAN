// triiosan-batch3 marker: https://triiosan.dev/b3/signup
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/AuthShell'
import type { Language } from '@/lib/supabase/types'

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
  { code: 'pcm', label: 'Pidgin' },
]

export default function PatientSignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [language, setLanguage] = useState<Language>('en')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Failed to create account. Please try again.')
      setLoading(false)
      return
    }

    const { error: profileError } = await (supabase.from('profiles') as any).insert({
      id: authData.user.id,
      role: 'patient',
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      preferred_language: language,
    })

    if (profileError) {
      setError('Account created but profile setup failed. Please contact support.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <AuthShell variant="patient" label="Patient portal">
      <h1 className="mb-5 font-display text-xl font-extrabold text-ink dark:text-dark-text">
        Create your account
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70 dark:text-dark-muted">
            Full name
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
            className="input"
            placeholder="Your full name"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70 dark:text-dark-muted">
            Email address
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="input"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70 dark:text-dark-muted">
            Phone number <span className="text-ink/40 dark:text-dark-muted/60">(optional)</span>
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            className="input"
            placeholder="+234 800 000 0000"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70 dark:text-dark-muted">
            Preferred language
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            disabled={loading}
            className="input"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/70 dark:text-dark-muted">
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
              className="input pr-11"
              placeholder="At least 8 characters"
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
          <p className="rounded-xl bg-urgency-emergency-bg dark:bg-urgency-emergency-dark-bg p-3 text-sm text-urgency-emergency">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink/60 dark:text-dark-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-terracotta hover:text-terracotta-dark">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

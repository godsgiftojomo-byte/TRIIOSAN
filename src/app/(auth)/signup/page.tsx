'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Wordmark } from '@/components/Wordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { UserRole, Language } from '@/lib/supabase/types'
import { LANGUAGES } from '@/lib/i18n/translations'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, lang } = useLanguage()
  const supabase = createClient()

  const initialRole = (searchParams.get('role') as UserRole) || 'patient'

  const [role, setRole] = useState<UserRole>(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [facility, setFacility] = useState('')
  const [preferredLang, setPreferredLang] = useState<Language>(lang)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      setError(authError?.message || t('auth.error.generic'))
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      role,
      full_name: fullName,
      phone: phone || null,
      preferred_language: preferredLang,
      ...(role === 'clinician'
        ? {
            specialty: specialty || null,
            facility: facility || null,
            verification_status: 'pending' as const,
          }
        : {}),
    })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // If email confirmation is disabled in Supabase, the user has a session already.
    // Redirect to login either way — simplest and most predictable for the demo.
    setTimeout(() => {
      router.push(`/login?role=${role}`)
    }, 1200)
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
          {t('auth.signup')}
        </h1>

        {/* Role toggle */}
        <div className="mt-6 flex rounded-lg border border-ink/10 bg-white p-1">
          {(['patient', 'clinician'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                role === r ? 'bg-ember text-white' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {r === 'patient' ? t('auth.patient') : t('auth.clinician')}
            </button>
          ))}
        </div>

        {success ? (
          <div className="mt-6 rounded-lg border border-urgency-routine/20 bg-urgency-routine-bg p-4 text-sm text-urgency-routine">
            {t('auth.signupSuccess')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label={t('auth.fullName')} required>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
              />
            </Field>

            <Field label={t('auth.email')} required>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </Field>

            <Field label={t('auth.password')} required>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </Field>

            <Field label={t('auth.phone')}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
              />
            </Field>

            {role === 'clinician' && (
              <>
                <Field label={t('auth.specialty')}>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. General Medicine, Paediatrics"
                    className="input"
                  />
                </Field>
                <Field label={t('auth.facility')}>
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="input"
                  />
                </Field>
              </>
            )}

            <Field label="Preferred language">
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as Language)}
                className="input"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeLabel}
                  </option>
                ))}
              </select>
            </Field>

            {error && (
              <p className="rounded-lg bg-urgency-emergency-bg p-3 text-sm text-urgency-emergency">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-ember px-6 py-3 text-base font-semibold text-white shadow-card transition-colors hover:bg-ember-dark disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('auth.signupCta')}
            </button>

            <p className="text-center text-sm text-ink/60">
              {t('auth.haveAccount')}{' '}
              <Link href={`/login?role=${role}`} className="font-semibold text-ember">
                {t('auth.loginCta')}
              </Link>
            </p>
          </form>
        )}
      </main>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">
        {label}
        {required && <span className="text-ember"> *</span>}
      </span>
      {children}
    </label>
  )
}

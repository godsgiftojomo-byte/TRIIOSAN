'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, Stethoscope, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Wordmark } from '@/components/Wordmark'

const SPECIALTIES = [
  'General Practice / Family Medicine',
  'Internal Medicine',
  'Paediatrics',
  'Obstetrics & Gynaecology',
  'Surgery',
  'Emergency Medicine',
  'Psychiatry',
  'Dermatology',
  'Cardiology',
  'Neurology',
  'Nursing',
  'Other',
]

export default function ClinicianSignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [facility, setFacility] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

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

    const { error: profileError } = (await supabase.from('profiles').insert({
      id: authData.user.id,
      role: 'clinician' as const,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      specialty: specialty || null,
      facility: facility.trim() || null,
      verification_status: 'pending',
    })) as { data: null; error: { message: string } | null }

    if (profileError) {
      setError('Account created but profile setup failed. Please contact support.')
      setLoading(false)
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-dark-bg">
        <div className="pattern-overlay pattern-strong h-2 bg-ember" />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-dark-border bg-dark-card p-8 text-center shadow-card-dark">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ember/10">
                <ShieldAlert className="h-7 w-7 text-ember" />
              </div>
              <h2 className="font-display text-lg font-extrabold text-dark-text">
                Application submitted
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-dark-muted">
                Your account has been created and is pending verification by the Triiosan admin team.
                You will be notified once your credentials have been reviewed and approved.
              </p>
              <p className="mt-4 text-xs text-dark-muted/60">
                Already verified?{' '}
                <Link href="/portal" className="text-ember hover:text-ember-dark">
                  Sign in to the portal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg">
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
              Request clinician access
            </h1>
            <p className="text-sm text-dark-muted mb-5">
              Your account will be reviewed and verified before access is granted.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-dark-muted">Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  className="input"
                  placeholder="Dr. Your Name"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-dark-muted">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="input"
                  placeholder="doctor@hospital.ng"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-dark-muted">
                  Phone <span className="text-dark-muted/50">(optional)</span>
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
                <span className="mb-1.5 block text-sm font-medium text-dark-muted">Specialty</span>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  disabled={loading}
                  className="input"
                >
                  <option value="" disabled>Select your specialty</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-dark-muted">
                  Hospital / Facility
                </span>
                <input
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  disabled={loading}
                  className="input"
                  placeholder="e.g. OOU Teaching Hospital"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-dark-muted">Password</span>
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit application'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-dark-muted">
              Already have access?{' '}
              <Link href="/portal" className="font-semibold text-ember hover:text-ember-dark">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


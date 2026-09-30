// triiosan-batch3 marker: https://triiosan.dev/b3/portal-signup
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/AuthShell'

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
      <AuthShell variant="clinician" label="Clinician portal">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-marigold/15">
            <ShieldAlert className="h-7 w-7 text-marigold" />
          </div>
          <h2 className="font-display text-xl font-extrabold text-dark-text">
            Application submitted
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-dark-muted">
            Your account has been created and is pending verification by the Triiosan admin team.
            You will be notified once your credentials have been reviewed and approved.
          </p>
          <p className="mt-4 text-xs text-dark-muted">
            Already verified?{' '}
            <Link href="/portal" className="font-semibold text-marigold hover:text-marigold-dark">
              Sign in to the portal
            </Link>
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell variant="clinician" label="Clinician portal">
      <h1 className="mb-1 font-display text-xl font-extrabold text-dark-text">
        Request clinician access
      </h1>
      <p className="mb-5 text-sm text-dark-muted">
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
            Phone <span className="text-dark-muted/60">(optional)</span>
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
            placeholder="e.g. Crestfield Teaching Hospital"
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit application'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-dark-muted">
        Already have access?{' '}
        <Link href="/portal" className="font-semibold text-marigold hover:text-marigold-dark">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

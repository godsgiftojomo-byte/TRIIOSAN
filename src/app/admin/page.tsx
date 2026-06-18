'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, Activity, ShieldCheck, ShieldAlert, AlertTriangle,
  Clock, CheckCircle2, MessageSquare, Loader2, LogOut, ChevronDown, ChevronUp
} from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'

interface Stats {
  totalCases: number; openCases: number; closedCases: number
  emergency: number; urgent: number; routine: number
  totalPatients: number; totalClinicians: number; pendingClinicians: number
  totalMessages: number
  recentActivity: { date: string; count: number }[]
}

interface Profile {
  id: string; role: string; full_name: string; email?: string
  specialty: string | null; facility: string | null
  verification_status: string | null; created_at: string
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [stats, setStats] = useState<Stats | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'clinicians' | 'patients'>('overview')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [statsRes, usersRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/users'),
    ])
    if (statsRes.ok) setStats(await statsRes.json().then((d) => d.stats))
    if (usersRes.ok) setProfiles(await usersRes.json().then((d) => d.profiles))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed) loadData()
  }, [authed, loadData])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      setAuthed(true)
    } else {
      const d = await res.json()
      setLoginError(d.error || 'Login failed')
    }
    setLoginLoading(false)
  }

  async function toggleVerification(userId: string, currentStatus: string) {
    const newStatus = currentStatus === 'verified' ? 'pending' : 'verified'
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, verification_status: newStatus }),
    })
    setProfiles((prev) =>
      prev.map((p) => p.id === userId ? { ...p, verification_status: newStatus } : p)
    )
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-dark-bg px-4">
        <div className="w-full max-w-xs">
          <div className="mb-8 text-center">
            <Wordmark className="justify-center" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-dark-muted">
              Admin Console
            </p>
          </div>
          <div className="rounded-2xl border border-dark-border bg-dark-card p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required disabled={loginLoading} className="input" placeholder="Admin email"
              />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required disabled={loginLoading} className="input" placeholder="Password"
              />
              {loginError && (
                <p className="text-sm text-urgency-emergency">{loginError}</p>
              )}
              <button type="submit" disabled={loginLoading} className="btn-primary w-full">
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const clinicians = profiles.filter((p) => p.role === 'clinician')
  const patients = profiles.filter((p) => p.role === 'patient')
  const pendingClinicians = clinicians.filter((c) => c.verification_status === 'pending')

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-dark-border bg-dark-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="rounded-full border border-dark-border px-2 py-0.5 text-xs font-semibold text-dark-muted">
              Admin
            </span>
          </div>
          <button
            onClick={() => setAuthed(false)}
            className="btn-ghost text-dark-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Pending alert */}
        {pendingClinicians.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-urgency-urgent/30 bg-urgency-urgent-dark-bg p-4">
            <ShieldAlert className="h-5 w-5 shrink-0 text-urgency-urgent" />
            <p className="text-sm text-dark-text">
              <span className="font-bold">{pendingClinicians.length} clinician{pendingClinicians.length > 1 ? 's' : ''}</span> pending verification.{' '}
              <button onClick={() => setActiveTab('clinicians')} className="underline text-ember">Review now</button>
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-dark-border bg-dark-card p-1">
          {(['overview', 'clinicians', 'patients'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-ember text-white'
                  : 'text-dark-muted hover:text-dark-text'
              }`}
            >
              {tab}
              {tab === 'clinicians' && pendingClinicians.length > 0 && (
                <span className="ml-1.5 rounded-full bg-urgency-urgent px-1.5 py-0.5 text-xs text-white">
                  {pendingClinicians.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-ember" />
          </div>
        )}

        {/* Overview tab */}
        {!loading && activeTab === 'overview' && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={Activity} label="Total cases" value={stats.totalCases} />
              <StatCard icon={Clock} label="Open" value={stats.openCases} color="text-urgency-urgent" />
              <StatCard icon={Users} label="Patients" value={stats.totalPatients} />
              <StatCard icon={MessageSquare} label="Messages" value={stats.totalMessages} />
            </div>

            <div className="rounded-2xl border border-dark-border bg-dark-card p-5">
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-dark-muted">
                Cases by urgency
              </h3>
              <div className="space-y-3">
                <UrgencyBar label="Emergency" value={stats.emergency} total={stats.totalCases} color="bg-urgency-emergency" />
                <UrgencyBar label="Urgent" value={stats.urgent} total={stats.totalCases} color="bg-urgency-urgent" />
                <UrgencyBar label="Routine" value={stats.routine} total={stats.totalCases} color="bg-urgency-routine" />
              </div>
            </div>

            <div className="rounded-2xl border border-dark-border bg-dark-card p-5">
              <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-dark-muted">
                Activity — last 14 days
              </h3>
              <div className="flex items-end gap-1 h-20">
                {stats.recentActivity.map(({ date, count }) => {
                  const max = Math.max(...stats.recentActivity.map((d) => d.count), 1)
                  const height = Math.max((count / max) * 100, count > 0 ? 8 : 2)
                  return (
                    <div key={date} className="flex flex-1 flex-col items-center gap-1" title={`${date}: ${count}`}>
                      <div
                        className="w-full rounded-sm bg-ember/60 transition-all"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="mt-1 flex justify-between text-xs text-dark-muted/50">
                <span>{stats.recentActivity[0]?.date.slice(5)}</span>
                <span>{stats.recentActivity[stats.recentActivity.length - 1]?.date.slice(5)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Clinicians tab */}
        {!loading && activeTab === 'clinicians' && (
          <div className="space-y-2">
            {clinicians.length === 0 && (
              <p className="text-center py-12 text-dark-muted">No clinician accounts yet.</p>
            )}
            {clinicians.map((c) => (
              <div key={c.id} className="rounded-2xl border border-dark-border bg-dark-card overflow-hidden">
                <button
                  onClick={() => setExpandedUser(expandedUser === c.id ? null : c.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    c.verification_status === 'verified' ? 'bg-urgency-routine-dark-bg' : 'bg-urgency-urgent-dark-bg'
                  }`}>
                    {c.verification_status === 'verified'
                      ? <ShieldCheck className="h-4 w-4 text-urgency-routine" />
                      : <ShieldAlert className="h-4 w-4 text-urgency-urgent" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-dark-text truncate">{c.full_name}</p>
                    <p className="text-xs text-dark-muted">{c.specialty || 'No specialty listed'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.verification_status === 'verified'
                      ? 'bg-urgency-routine-dark-bg text-urgency-routine'
                      : 'bg-urgency-urgent-dark-bg text-urgency-urgent'
                  }`}>
                    {c.verification_status}
                  </span>
                  {expandedUser === c.id ? <ChevronUp className="h-4 w-4 text-dark-muted shrink-0" /> : <ChevronDown className="h-4 w-4 text-dark-muted shrink-0" />}
                </button>

                {expandedUser === c.id && (
                  <div className="border-t border-dark-border px-4 pb-4 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-dark-muted">Facility</p>
                        <p className="text-dark-text">{c.facility || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-dark-muted">Joined</p>
                        <p className="text-dark-text">{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleVerification(c.id, c.verification_status || 'pending')}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                        c.verification_status === 'verified'
                          ? 'border border-urgency-emergency/30 text-urgency-emergency hover:bg-urgency-emergency-dark-bg'
                          : 'bg-ember text-white hover:bg-ember-dark'
                      }`}
                    >
                      {c.verification_status === 'verified' ? 'Revoke verification' : 'Verify clinician'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Patients tab */}
        {!loading && activeTab === 'patients' && (
          <div className="space-y-2">
            {patients.length === 0 && (
              <p className="text-center py-12 text-dark-muted">No patient accounts yet.</p>
            )}
            {patients.map((p) => (
              <div key={p.id} className="rounded-2xl border border-dark-border bg-dark-card flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dark-surface">
                  <Users className="h-4 w-4 text-dark-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-dark-text truncate">{p.full_name}</p>
                  <p className="text-xs text-dark-muted">
                    Joined {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = 'text-dark-text' }: {
  icon: typeof Activity; label: string; value: number; color?: string
}) {
  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card p-4">
      <Icon className="h-4 w-4 text-dark-muted mb-2" />
      <p className={`font-display text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-dark-muted mt-0.5">{label}</p>
    </div>
  )
}

function UrgencyBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-dark-muted shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-dark-border overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-dark-text">{value}</span>
    </div>
  )
}

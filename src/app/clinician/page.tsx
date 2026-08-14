import Link from 'next/link'
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, ShieldAlert, CalendarCheck } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { t } from '@/lib/i18n/translations'
import { UNBOOKED_STATUSES } from '@/lib/cases/status'
import type { TriageCase, Urgency, Profile } from '@/lib/supabase/types'

const URGENCY_CONFIG: Record<Urgency, { icon: typeof AlertTriangle; color: string; bg: string; rank: number }> = {
  emergency: { icon: AlertTriangle, color: 'text-urgency-emergency', bg: 'bg-urgency-emergency-bg', rank: 0 },
  urgent: { icon: Clock, color: 'text-urgency-urgent', bg: 'bg-urgency-urgent-bg', rank: 1 },
  routine: { icon: CheckCircle2, color: 'text-urgency-routine', bg: 'bg-urgency-routine-bg', rank: 2 },
}

const UNRANKED = 99

type SlotJoin = {
  slot_date: string
  window_start: string
  window_end: string
  cadre: string
} | null

export default async function ClinicianQueuePage() {
  const { profile } = await requireProfile('clinician')
  const supabase = createClient()
  const lang = profile.preferred_language
  const isVerified = profile.verification_status === 'verified'

  // Two lists now, not one.
  //
  // The work queue is cases still waiting to be booked. The old query
  // asked for status 'open' and that is still correct here, but only
  // because 'open' now means specifically "not yet booked".
  const { data: cases } = await supabase
    .from('triage_cases')
    .select('*')
    .in('status', UNBOOKED_STATUSES)
    .order('created_at', { ascending: true })

  // Booked patients. Without this list a clinician arriving for a
  // booked session cannot see who is expected in which window, which
  // is the entire point of running a booked session.
  const { data: scheduledRaw } = await supabase
    .from('triage_cases')
    .select('*, appointment_slots(slot_date, window_start, window_end, cadre)')
    .eq('status', 'scheduled')
    .order('created_at', { ascending: true })

  const typedCases = (cases || []) as TriageCase[]
  const scheduledCases = (scheduledRaw || []) as (TriageCase & { appointment_slots: SlotJoin })[]

  const sortedCases = [...typedCases].sort((a, b) => {
    const rankA = a.urgency ? URGENCY_CONFIG[a.urgency].rank : UNRANKED
    const rankB = b.urgency ? URGENCY_CONFIG[b.urgency].rank : UNRANKED
    return rankA - rankB
  })

  // Booked patients sort by when they are due, not by urgency. On the
  // day, the clinician needs them in arrival order.
  const sortedScheduled = [...scheduledCases].sort((a, b) => {
    const ka = `${a.appointment_slots?.slot_date ?? ''}${a.appointment_slots?.window_start ?? ''}`
    const kb = `${b.appointment_slots?.slot_date ?? ''}${b.appointment_slots?.window_start ?? ''}`
    return ka.localeCompare(kb)
  })

  const patientIds = [
    ...new Set([...typedCases, ...scheduledCases].map((c) => c.patient_id)),
  ]
  const patientNames = new Map<string, string>()

  if (patientIds.length > 0) {
    const { data: patientProfilesRaw } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', patientIds)

    const patientProfiles = (patientProfilesRaw || []) as Pick<Profile, 'id' | 'full_name'>[]

    for (const p of patientProfiles) {
      patientNames.set(p.id, p.full_name)
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav role="clinician" fullName={profile.full_name} />

      <main className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          {!isVerified && (
            <div className="flex items-start gap-3 rounded-xl border border-urgency-urgent/30 bg-urgency-urgent-bg p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-urgency-urgent" />
              <p className="text-sm leading-relaxed text-ink/80">{t(lang, 'auth.pendingBanner')}</p>
            </div>
          )}

          {/* ── Booked patients ───────────────────────────────── */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
              <CalendarCheck className="h-5 w-5 text-teal" />
              {t(lang, 'clinician.scheduledSection')}
            </h2>

            {sortedScheduled.length === 0 ? (
              <div className="card text-center">
                <p className="text-sm text-ink/60">{t(lang, 'clinician.scheduledEmpty')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {sortedScheduled.map((c) => {
                  const slot = c.appointment_slots
                  const patientName = patientNames.get(c.patient_id) || '—'
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/case/${c.id}`}
                        className="card flex items-center gap-3 border-teal/20 transition-colors hover:border-teal/40"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10">
                          <CalendarCheck className="h-5 w-5 text-teal" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{patientName}</p>
                          {slot && (
                            <p className="mt-0.5 text-sm font-medium text-ink/70">
                              {new Date(slot.slot_date + 'T00:00:00').toLocaleDateString(undefined, {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                              {', '}
                              {slot.window_start.slice(0, 5)} – {slot.window_end.slice(0, 5)}
                              {' · '}
                              {slot.cadre}
                            </p>
                          )}
                          <p className="mt-0.5 truncate text-sm text-ink/60">{c.primary_complaint}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink/30" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* ── Work queue: not yet booked ────────────────────── */}
          <section className="space-y-3">
            <h1 className="font-display text-lg font-extrabold text-ink">
              {t(lang, 'clinician.queueTitle')}
            </h1>

            {sortedCases.length === 0 ? (
              <div className="card text-center">
                <p className="text-sm text-ink/60">{t(lang, 'clinician.queueEmpty')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {sortedCases.map((c) => {
                  const config = c.urgency ? URGENCY_CONFIG[c.urgency] : null
                  const Icon = config?.icon
                  const patientName = patientNames.get(c.patient_id) || '—'

                  return (
                    <li key={c.id}>
                      <Link
                        href={`/case/${c.id}`}
                        className="card flex items-center gap-3 transition-colors hover:border-teal/30"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            config?.bg || 'bg-ink/5'
                          }`}
                        >
                          {Icon ? (
                            <Icon className={`h-5 w-5 ${config!.color}`} />
                          ) : (
                            <Clock className="h-5 w-5 text-ink/30" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-ink">{patientName}</p>
                            {config && (
                              <span className={`font-display text-xs font-bold ${config.color}`}>
                                {t(lang, `case.urgency.${c.urgency}`)}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-sm text-ink/60">{c.primary_complaint}</p>
                          <p className="mt-1 text-xs text-ink/40">
                            {t(lang, 'clinician.submittedAt')}{' '}
                            {new Date(c.created_at).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-ink/30" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

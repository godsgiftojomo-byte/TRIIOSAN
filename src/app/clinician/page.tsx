import Link from 'next/link'
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { t } from '@/lib/i18n/translations'
import type { TriageCase, Urgency } from '@/lib/supabase/types'

const URGENCY_CONFIG: Record<Urgency, { icon: typeof AlertTriangle; color: string; bg: string; rank: number }> = {
  emergency: { icon: AlertTriangle, color: 'text-urgency-emergency', bg: 'bg-urgency-emergency-bg', rank: 0 },
  urgent: { icon: Clock, color: 'text-urgency-urgent', bg: 'bg-urgency-urgent-bg', rank: 1 },
  routine: { icon: CheckCircle2, color: 'text-urgency-routine', bg: 'bg-urgency-routine-bg', rank: 2 },
}

// Cases with no urgency yet (e.g. the AI/rule pipeline didn't set one —
// shouldn't normally happen, but the schema allows null) sort last.
const UNRANKED = 99

export default async function ClinicianQueuePage() {
  const { profile } = await requireProfile('clinician')
  const supabase = createClient()
  const lang = profile.preferred_language
  const isVerified = profile.verification_status === 'verified'

  // Verified clinicians can see the full open queue (per RLS). A pending
  // clinician's "Clinicians can view cases" RLS policy check will fail
  // (it requires verification_status = 'verified'), so this query will
  // simply return no rows for them — which is the correct behavior:
  // they see the pending banner and an empty queue, not an error.
  const { data: cases } = await supabase
    .from('triage_cases')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  const typedCases = (cases || []) as TriageCase[]

  // Sort by urgency (emergency first), preserving the created_at order
  // (oldest first / FIFO) within each urgency tier.
  const sortedCases = [...typedCases].sort((a, b) => {
    const rankA = a.urgency ? URGENCY_CONFIG[a.urgency].rank : UNRANKED
    const rankB = b.urgency ? URGENCY_CONFIG[b.urgency].rank : UNRANKED
    return rankA - rankB
  })

  // Look up patient names for display. Patients are visible to clinicians
  // under the "Clinicians can view patient profiles" RLS policy.
  const patientIds = [...new Set(typedCases.map((c) => c.patient_id))]
  const patientNames = new Map<string, string>()

  if (patientIds.length > 0) {
    const { data: patientProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', patientIds)

    for (const p of patientProfiles || []) {
      patientNames.set(p.id, p.full_name)
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav role="clinician" fullName={profile.full_name} />

      <main className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
            {t(lang, 'clinician.queueTitle')}
          </h1>

          {!isVerified && (
            <div className="flex items-start gap-3 rounded-xl border border-urgency-urgent/30 bg-urgency-urgent-bg p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-urgency-urgent" />
              <p className="text-sm leading-relaxed text-ink/80">{t(lang, 'auth.pendingBanner')}</p>
            </div>
          )}

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
                      className="card flex items-center gap-3 transition-colors hover:border-ember/30"
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
        </div>
      </main>
    </div>
  )
}

import Link from 'next/link'
import { MessageCircle, ArrowRight, CalendarCheck } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { t } from '@/lib/i18n/translations'
import { SymptomChecker } from './SymptomChecker'
import { ACTIVE_STATUSES } from '@/lib/cases/status'
import type { TriageCase } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const { userId, profile } = await requireProfile('patient')
  const supabase = createClient()
  const lang = profile.preferred_language

  // This query used to be `.eq('status', 'open')`.
  //
  // That was the single worst break caused by the lifecycle change:
  // a patient books an appointment, their case becomes 'scheduled',
  // and it vanishes from their own dashboard. This is the screen they
  // check on the day to see their window, so it has to show scheduled
  // cases, not hide them.
  const { data: activeCases } = await supabase
    .from('triage_cases')
    .select('*, appointment_slots(slot_date, window_start, window_end)')
    .eq('patient_id', userId)
    .in('status', ACTIVE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeCase =
    (activeCases?.[0] as (TriageCase & {
      appointment_slots: {
        slot_date: string
        window_start: string
        window_end: string
      } | null
    }) | undefined) || null

  const slot = activeCase?.appointment_slots ?? null
  const isScheduled = activeCase?.status === 'scheduled' && !!slot

  return (
    <div className="min-h-screen">
      <AppNav role="patient" fullName={profile.full_name} />
      <main className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-4">
          {activeCase && (
            <Link
              href={`/case/${activeCase.id}`}
              className="card flex items-center gap-3 border-teal/20 bg-teal/5 transition-colors hover:border-teal/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                {isScheduled ? (
                  <CalendarCheck className="h-5 w-5 text-teal" />
                ) : (
                  <MessageCircle className="h-5 w-5 text-teal" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {isScheduled
                    ? t(lang, 'thread.statusScheduled')
                    : t(lang, 'dashboard.openCaseBanner')}
                </p>

                {isScheduled && slot ? (
                  <p className="mt-0.5 text-sm font-medium text-ink/80">
                    {new Date(slot.slot_date + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                    {', '}
                    {slot.window_start.slice(0, 5)} – {slot.window_end.slice(0, 5)}
                  </p>
                ) : null}

                <p className="mt-0.5 truncate text-sm text-ink/60">
                  {activeCase.primary_complaint}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-teal" />
            </Link>
          )}

          <SymptomChecker preferredLanguage={profile.preferred_language} />
        </div>
      </main>
    </div>
  )
}

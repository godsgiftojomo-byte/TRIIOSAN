// triiosan-batch5 marker: https://triiosan.dev/b5/history
import Link from 'next/link'
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, PlusCircle } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { t } from '@/lib/i18n/translations'
import type { TriageCase, Urgency } from '@/lib/supabase/types'

const URGENCY_CONFIG: Record<Urgency, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  emergency: { icon: AlertTriangle, color: 'text-urgency-emergency', bg: 'bg-urgency-emergency-bg' },
  urgent: { icon: Clock, color: 'text-urgency-urgent', bg: 'bg-urgency-urgent-bg' },
  routine: { icon: CheckCircle2, color: 'text-urgency-routine', bg: 'bg-urgency-routine-bg' },
}

export default async function HistoryPage() {
  const { userId, profile } = await requireProfile('patient')
  const supabase = createClient()
  const lang = profile.preferred_language

  const { data: cases } = await supabase
    .from('triage_cases')
    .select('*')
    .eq('patient_id', userId)
    .order('created_at', { ascending: false })

  const typedCases = (cases || []) as TriageCase[]

  return (
    <div className="min-h-screen">
      <AppNav role="patient" fullName={profile.full_name} />

      <main className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <p className="eyebrow mb-1">Triiosan</p>
            <h1 className="font-display text-2xl font-extrabold text-ink dark:text-dark-text sm:text-3xl">
              {t(lang, 'history.title')}
            </h1>
          </div>

          {typedCases.length === 0 ? (
            <div className="card-pop text-center">
              <div aria-hidden className="art art-footprints mx-auto mb-3 h-16 w-16 text-terracotta opacity-30" />
              <p className="text-sm text-ink/70 dark:text-dark-muted">{t(lang, 'history.empty')}</p>
              <Link href="/dashboard" className="btn-primary mt-4 inline-flex">
                <PlusCircle className="h-4 w-4" />
                {t(lang, 'history.startNew')}
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {typedCases.map((c) => {
                const config = c.urgency ? URGENCY_CONFIG[c.urgency] : null
                const Icon = config?.icon
                return (
                  <li key={c.id}>
                    <Link
                      href={`/case/${c.id}`}
                      className="card flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-terracotta/50 hover:shadow-pop-sm"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          config?.bg || 'bg-ink/5 dark:bg-dark-border'
                        }`}
                      >
                        {Icon ? (
                          <Icon className={`h-5 w-5 ${config!.color}`} />
                        ) : (
                          <Clock className="h-5 w-5 text-ink/30 dark:text-dark-muted" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink dark:text-dark-text">
                          {c.primary_complaint}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-ink/60 dark:text-dark-muted">
                          <span>
                            {new Date(c.created_at).toLocaleDateString(undefined, {
                              dateStyle: 'medium',
                            })}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              c.status === 'open' ? 'font-bold text-terracotta dark:text-terracotta-light' : 'text-ink/40 dark:text-dark-muted'
                            }
                          >
                            {t(lang, c.status === 'open' ? 'thread.statusOpen' : 'thread.statusClosed')}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-ink/30 dark:text-dark-muted" />
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

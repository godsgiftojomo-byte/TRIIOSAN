'use client'

import Link from 'next/link'
import { ArrowRight, Stethoscope, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Wordmark />
        <LanguageSwitcher />
      </header>

      {/* Hero */}
      <main className="px-6 sm:px-10">
        <section className="mx-auto max-w-5xl pt-8 pb-16 sm:pt-16">
          <div className="grid gap-12 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
                {t('landing.heroTitle')}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/70 sm:text-lg">
                {t('landing.heroSubtitle')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?role=patient"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-ember px-6 py-3.5 text-base font-semibold text-white shadow-card transition-colors hover:bg-ember-dark"
                >
                  {t('landing.ctaPatient')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login?role=clinician"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-6 py-3.5 text-base font-semibold text-ink transition-colors hover:border-ink/30"
                >
                  <Stethoscope className="h-4 w-4" />
                  {t('landing.ctaClinician')}
                </Link>
              </div>

              <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/50">
                {t('landing.disclaimer')}
              </p>
            </div>

            {/* Signature element: the urgency result card, shown as a live preview */}
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-ember/5 sm:-inset-8" />
              <UrgencyPreviewCard />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

/**
 * A stacked preview of the three urgency outcomes — this is the
 * signature visual element. It previews what a patient receives
 * at the end of the symptom-check flow, before they've even started.
 */
function UrgencyPreviewCard() {
  const { t } = useLanguage()

  const rows = [
    {
      key: 'emergency',
      label: t('case.urgency.emergency'),
      icon: AlertTriangle,
      color: 'text-urgency-emergency',
      bg: 'bg-urgency-emergency-bg',
      border: 'border-urgency-emergency/20',
      active: false,
    },
    {
      key: 'urgent',
      label: t('case.urgency.urgent'),
      icon: Clock,
      color: 'text-urgency-urgent',
      bg: 'bg-urgency-urgent-bg',
      border: 'border-urgency-urgent/30',
      active: true,
    },
    {
      key: 'routine',
      label: t('case.urgency.routine'),
      icon: CheckCircle2,
      color: 'text-urgency-routine',
      bg: 'bg-urgency-routine-bg',
      border: 'border-urgency-routine/20',
      active: false,
    },
  ]

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-2 shadow-card">
      <div className="space-y-2 p-2">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <div
              key={row.key}
              className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                row.active
                  ? `${row.bg} ${row.border} scale-[1.02]`
                  : 'border-ink/5 opacity-50'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  row.active ? 'bg-white' : 'bg-ink/5'
                }`}
              >
                <Icon className={`h-5 w-5 ${row.active ? row.color : 'text-ink/30'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-display text-sm font-bold ${row.active ? row.color : 'text-ink/40'}`}>
                  {row.label}
                </p>
                {row.active && (
                  <p className="mt-0.5 text-xs leading-snug text-ink/60">
                    {t('case.urgency.urgentDesc')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ArrowRight, Stethoscope, AlertTriangle, Clock, CheckCircle2, ShieldCheck, Zap, Users } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-bg">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Wordmark />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Hero — pattern prominent here */}
      <section className="relative overflow-hidden">
        <div className="pattern-overlay pattern-strong absolute inset-0 bg-ember" style={{ opacity: 1 }} />
        <div className="relative px-6 py-16 sm:px-10 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <Zap className="h-3 w-3" /> AI-Powered Triage
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-bold text-ember shadow-card transition-all hover:shadow-md active:scale-[0.98]"
              >
                {t('landing.ctaPatient')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 text-base font-bold text-white transition-all hover:border-white/60 hover:bg-white/10"
              >
                <Stethoscope className="h-4 w-4" />
                {t('landing.ctaClinician')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center font-display text-2xl font-extrabold text-ink dark:text-dark-text sm:text-3xl">
            {t('landing.howItWorks')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc'), icon: Users },
              { step: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc'), icon: Zap },
              { step: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc'), icon: Stethoscope },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="card pattern-section pattern-faint relative overflow-hidden">
                <p className="font-display text-4xl font-extrabold text-ember/10 dark:text-ember/20 absolute top-3 right-4">
                  {step}
                </p>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ember/10">
                  <Icon className="h-5 w-5 text-ember" />
                </div>
                <h3 className="font-display text-base font-bold text-ink dark:text-dark-text">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60 dark:text-dark-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency preview — signature element */}
      <section className="px-6 pb-16 sm:px-10">
        <div className="mx-auto max-w-md">
          <h2 className="mb-6 text-center font-display text-lg font-extrabold text-ink dark:text-dark-text">
            {t('landing.triagePreviewTitle')}
          </h2>
          <UrgencyPreviewCard t={t} />
          <p className="mt-4 text-center text-xs leading-relaxed text-ink/40 dark:text-dark-muted">
            {t('landing.disclaimer')}
          </p>
        </div>
      </section>

      {/* Clinician CTA strip */}
      <section className="pattern-overlay pattern-medium border-t border-ink/8 dark:border-dark-border bg-ink dark:bg-dark-surface px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left sm:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-ember shrink-0" />
            <div>
              <p className="font-display font-bold text-white">{t('landing.clinicianCta')}</p>
              <p className="text-sm text-white/50">{t('landing.clinicianCtaDesc')}</p>
            </div>
          </div>
          <Link href="/portal" className="btn-primary shrink-0">
            {t('landing.ctaClinician')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function UrgencyPreviewCard({ t }: { t: (k: string) => string }) {
  const rows = [
    { key: 'emergency', label: t('case.urgency.emergency'), icon: AlertTriangle, color: 'text-urgency-emergency', bg: 'bg-urgency-emergency-bg dark:bg-urgency-emergency-dark-bg', border: 'border-urgency-emergency/20', active: false },
    { key: 'urgent', label: t('case.urgency.urgent'), icon: Clock, color: 'text-urgency-urgent', bg: 'bg-urgency-urgent-bg dark:bg-urgency-urgent-dark-bg', border: 'border-urgency-urgent/30', active: true },
    { key: 'routine', label: t('case.urgency.routine'), icon: CheckCircle2, color: 'text-urgency-routine', bg: 'bg-urgency-routine-bg dark:bg-urgency-routine-dark-bg', border: 'border-urgency-routine/20', active: false },
  ]
  return (
    <div className="card">
      <div className="space-y-2">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <div key={row.key} className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${row.active ? `${row.bg} ${row.border} scale-[1.02]` : 'border-ink/5 dark:border-dark-border opacity-50'}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${row.active ? 'bg-white dark:bg-dark-card' : 'bg-ink/5 dark:bg-dark-border'}`}>
                <Icon className={`h-5 w-5 ${row.active ? row.color : 'text-ink/30 dark:text-dark-muted'}`} />
              </div>
              <div>
                <p className={`font-display text-sm font-bold ${row.active ? row.color : 'text-ink/40 dark:text-dark-muted'}`}>{row.label}</p>
                {row.active && <p className="mt-0.5 text-xs leading-snug text-ink/60 dark:text-dark-muted">{t('case.urgency.urgentDesc')}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

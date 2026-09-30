// triiosan-batch2 marker: https://triiosan.dev/b2/landing
'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Stethoscope,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  MessageCircleHeart,
} from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { LANGUAGES } from '@/lib/i18n/translations'

function tileSize(px: number): CSSProperties {
  return { ['--art-size' as string]: `${px}px` } as CSSProperties
}

export default function LandingPage() {
  const { t } = useLanguage()

  const steps = [
    {
      step: '01',
      title: t('landing.step1Title'),
      desc: t('landing.step1Desc'),
      icon: MessageCircleHeart,
      art: 'art-adinkra-1',
      chip: 'bg-terracotta text-cream',
      shadow: 'text-terracotta',
    },
    {
      step: '02',
      title: t('landing.step2Title'),
      desc: t('landing.step2Desc'),
      icon: Zap,
      art: 'art-adinkra-2',
      chip: 'bg-marigold text-ink',
      shadow: 'text-marigold',
    },
    {
      step: '03',
      title: t('landing.step3Title'),
      desc: t('landing.step3Desc'),
      icon: Stethoscope,
      art: 'art-adinkra-3',
      chip: 'bg-indigo text-cream',
      shadow: 'text-indigo dark:text-indigo-light',
    },
  ]

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

      {/* Hero: terracotta block, tiled adinkra, ribbons */}
      <section className="section-terracotta relative overflow-hidden">
        <div
          aria-hidden
          className="art art-adinkra-2 art-tile art-faint absolute inset-0 text-cream"
          style={tileSize(150)}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/ribbons.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-6 w-44 rotate-6 opacity-95 sm:right-4 sm:w-64 lg:w-80"
        />
        <div className="relative px-6 pb-20 pt-24 sm:px-10 sm:pb-28 sm:pt-28">
          <div className="mx-auto max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-marigold px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ink shadow-pop-sm">
              <Zap className="h-3 w-3" /> AI-Powered Triage
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-6xl lg:text-7xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/90 sm:text-lg">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn-pop group px-7 py-4 text-base">
                {t('landing.ctaPatient')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/portal"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-cream/60 px-7 py-4 text-base font-bold text-cream transition-all hover:border-cream hover:bg-cream/10 active:scale-[0.98]"
              >
                <Stethoscope className="h-4 w-4" />
                {t('landing.ctaClinician')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Languages strip */}
      <section className="section-marigold border-y-2 border-ink">
        <ul className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-4 font-display text-sm font-bold sm:text-base">
          {LANGUAGES.map((l, i) => (
            <li key={l.code} className="flex items-center gap-6">
              <span>{l.nativeLabel}</span>
              {i < LANGUAGES.length - 1 && (
                <span aria-hidden className="art art-adinkra-3 h-3.5 w-3.5 text-ink" />
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow mb-2 text-center">Triiosan</p>
          <h2 className="mb-12 text-center font-display text-3xl font-extrabold text-ink dark:text-dark-text sm:text-4xl">
            {t('landing.howItWorks')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map(({ step, title, desc, icon: Icon, art, chip, shadow }) => (
              <div key={step} className="card-pop relative overflow-hidden">
                <div
                  aria-hidden
                  className={`art ${art} absolute -bottom-4 -right-4 h-28 w-28 opacity-10 ${shadow}`}
                />
                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink dark:border-dark-text ${chip}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="font-display text-3xl font-extrabold text-ink/20 dark:text-dark-text/20">
                      {step}
                    </p>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink dark:text-dark-text">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-dark-muted">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency preview: triage colours stay their own, on an indigo stage */}
      <section className="section-indigo relative overflow-hidden px-6 py-20 sm:px-10">
        <div
          aria-hidden
          className="art art-adinkra-5 art-tile art-faint absolute inset-0 text-cream"
          style={tileSize(130)}
        />
        <div className="relative mx-auto max-w-md">
          <h2 className="mb-8 text-center font-display text-2xl font-extrabold text-cream sm:text-3xl">
            {t('landing.triagePreviewTitle')}
          </h2>
          <UrgencyPreviewCard t={t} />
          <p className="mt-6 text-center text-xs leading-relaxed text-cream/70">
            {t('landing.disclaimer')}
          </p>
        </div>
      </section>

      {/* Clinician CTA */}
      <section className="section-ink relative overflow-hidden px-6 py-14 sm:px-10">
        <div
          aria-hidden
          className="art art-footprints art-tile art-faint absolute inset-0 text-marigold"
          style={tileSize(110)}
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/art/doctor.webp"
              alt=""
              aria-hidden
              className="h-24 w-auto shrink-0 drop-shadow-lg"
            />
            <div>
              <p className="flex items-center justify-center gap-2 font-display text-xl font-bold text-cream sm:justify-start">
                <ShieldCheck className="h-5 w-5 shrink-0 text-marigold" />
                {t('landing.clinicianCta')}
              </p>
              <p className="mt-1 text-sm text-cream/70">{t('landing.clinicianCtaDesc')}</p>
            </div>
          </div>
          <Link href="/portal" className="btn-accent shrink-0">
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
    <div className="card-pop">
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

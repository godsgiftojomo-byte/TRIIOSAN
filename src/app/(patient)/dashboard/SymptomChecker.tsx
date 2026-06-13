'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, AlertTriangle, Clock, CheckCircle2, FlaskConical } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { ChecklistItem, Language, Urgency } from '@/lib/supabase/types'

type Step = 'complaint' | 'loading-checklist' | 'checklist' | 'loading-result' | 'result'

interface AssessResult {
  caseId: string
  urgency: Urgency
  assessment: string
  recommendedTests: string[]
}

export function SymptomChecker({ preferredLanguage }: { preferredLanguage: Language }) {
  const { t, lang } = useLanguage()
  const router = useRouter()

  const [step, setStep] = useState<Step>('complaint')
  const [complaint, setComplaint] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<AssessResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Use the active UI language for the LLM calls, falling back to the
  // patient's stored preference. The patient can write in any language
  // regardless of UI language, but this gives the model a strong hint.
  const effectiveLanguage = lang || preferredLanguage

  async function handleComplaintSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!complaint.trim()) return

    setStep('loading-checklist')
    setError(null)

    try {
      const res = await fetch('/api/triage/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint, language: effectiveLanguage }),
      })

      if (!res.ok) throw new Error('Failed to generate checklist')

      const data = await res.json()
      setQuestions(data.questions)
      setAnswers(new Array(data.questions.length).fill(''))
      setStep('checklist')
    } catch (err) {
      console.error(err)
      setError(t('common.error'))
      setStep('complaint')
    }
  }

  async function handleChecklistSubmit(e: React.FormEvent) {
    e.preventDefault()

    setStep('loading-result')
    setError(null)

    const checklist: ChecklistItem[] = questions.map((q, i) => ({
      question: q,
      answer: answers[i] || '',
    }))

    try {
      const res = await fetch('/api/triage/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint, checklist, language: effectiveLanguage }),
      })

      if (!res.ok) throw new Error('Failed to assess')

      const data = await res.json()
      setResult({
        caseId: data.case.id,
        urgency: data.urgency,
        assessment: data.assessment,
        recommendedTests: data.recommendedTests,
      })
      setStep('result')
    } catch (err) {
      console.error(err)
      setError(t('common.error'))
      setStep('checklist')
    }
  }

  if (step === 'complaint' || step === 'loading-checklist') {
    return (
      <div className="card">
        <h1 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
          {t('case.step1Title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">{t('case.step1Prompt')}</p>

        <form onSubmit={handleComplaintSubmit} className="mt-5">
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder={t('case.step1Placeholder')}
            rows={6}
            required
            disabled={step === 'loading-checklist'}
            className="textarea"
          />

          {error && (
            <p className="mt-2 rounded-lg bg-urgency-emergency-bg p-3 text-sm text-urgency-emergency">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={step === 'loading-checklist' || !complaint.trim()}
            className="btn-primary mt-4 w-full sm:w-auto"
          >
            {step === 'loading-checklist' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('case.generatingChecklist')}
              </>
            ) : (
              <>
                {t('case.continue')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  if (step === 'checklist' || step === 'loading-result') {
    return (
      <div className="card">
        <h1 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
          {t('case.step2Title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">{t('case.step2Prompt')}</p>

        <form onSubmit={handleChecklistSubmit} className="mt-5 space-y-4">
          {questions.map((q, i) => (
            <label key={i} className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">{q}</span>
              <input
                type="text"
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                }}
                placeholder={t('case.skip')}
                disabled={step === 'loading-result'}
                className="input"
              />
            </label>
          ))}

          {error && (
            <p className="rounded-lg bg-urgency-emergency-bg p-3 text-sm text-urgency-emergency">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={step === 'loading-result'}
            className="btn-primary w-full sm:w-auto"
          >
            {step === 'loading-result' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('case.analyzing')}
              </>
            ) : (
              <>
                {t('case.submit')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  if (step === 'result' && result) {
    return <ResultView result={result} onContinue={() => router.push(`/case/${result.caseId}`)} />
  }

  return null
}

const URGENCY_CONFIG: Record<
  Urgency,
  { icon: typeof AlertTriangle; color: string; bg: string; border: string }
> = {
  emergency: {
    icon: AlertTriangle,
    color: 'text-urgency-emergency',
    bg: 'bg-urgency-emergency-bg',
    border: 'border-urgency-emergency/30',
  },
  urgent: {
    icon: Clock,
    color: 'text-urgency-urgent',
    bg: 'bg-urgency-urgent-bg',
    border: 'border-urgency-urgent/30',
  },
  routine: {
    icon: CheckCircle2,
    color: 'text-urgency-routine',
    bg: 'bg-urgency-routine-bg',
    border: 'border-urgency-routine/30',
  },
}

function ResultView({
  result,
  onContinue,
}: {
  result: AssessResult
  onContinue: () => void
}) {
  const { t } = useLanguage()
  const config = URGENCY_CONFIG[result.urgency]
  const Icon = config.icon

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
        {t('case.resultTitle')}
      </h1>

      {/* Urgency result — the signature element, echoed from the landing page */}
      <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-5`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <h2 className={`font-display text-2xl font-extrabold ${config.color}`}>
            {t(`case.urgency.${result.urgency}`)}
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          {t(`case.urgency.${result.urgency}Desc`)}
        </p>
      </div>

      {/* AI assessment summary */}
      <div className="card">
        <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
          {t('case.assessmentSummary')}
        </h3>
        <p className="text-sm leading-relaxed text-ink/80">{result.assessment}</p>
      </div>

      {/* Recommended tests */}
      {result.recommendedTests.length > 0 && (
        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
            <FlaskConical className="h-4 w-4 text-ember" />
            {t('case.recommendedTests')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {result.recommendedTests.map((test, i) => (
              <li
                key={i}
                className="rounded-full border border-ember/20 bg-ember-50 px-3 py-1.5 text-sm font-medium text-ember-dark"
              >
                {test}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={onContinue} className="btn-primary w-full">
        {t('case.goToCase')}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

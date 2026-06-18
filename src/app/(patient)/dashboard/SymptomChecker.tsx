'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2, ArrowRight, AlertTriangle, Clock, CheckCircle2,
  FlaskConical, Zap, ChevronRight, Activity
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { ChecklistItem, Language, Urgency } from '@/lib/supabase/types'

type Step =
  | 'complaint'
  | 'loading-base'
  | 'base-questions'
  | 'loading-ai-questions'
  | 'ai-questions'
  | 'loading-result'
  | 'result'

interface AssessResult {
  caseId: string
  urgency: Urgency
  assessment: string
  assessmentDetail: string
  recommendedTests: string[]
  immediateAction: string
  protocolName: string | null
  aiUnavailable: boolean
}

const URGENCY_CONFIG: Record<Urgency, {
  icon: typeof AlertTriangle
  color: string
  bg: string
  border: string
  darkBg: string
  label: string
}> = {
  emergency: {
    icon: AlertTriangle,
    color: 'text-urgency-emergency',
    bg: 'bg-urgency-emergency-bg',
    darkBg: 'dark:bg-urgency-emergency-dark-bg',
    border: 'border-urgency-emergency/40',
    label: 'Emergency',
  },
  urgent: {
    icon: Clock,
    color: 'text-urgency-urgent',
    bg: 'bg-urgency-urgent-bg',
    darkBg: 'dark:bg-urgency-urgent-dark-bg',
    border: 'border-urgency-urgent/40',
    label: 'Urgent',
  },
  routine: {
    icon: CheckCircle2,
    color: 'text-urgency-routine',
    bg: 'bg-urgency-routine-bg',
    darkBg: 'dark:bg-urgency-routine-dark-bg',
    border: 'border-urgency-routine/40',
    label: 'Routine',
  },
}

export function SymptomChecker({ preferredLanguage }: { preferredLanguage: Language }) {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const effectiveLang = lang || preferredLanguage

  const [step, setStep] = useState<Step>('complaint')
  const [complaint, setComplaint] = useState('')

  // Base (WHO) questions + answers
  const [baseQuestions, setBaseQuestions] = useState<string[]>([])
  const [baseAnswers, setBaseAnswers] = useState<string[]>([])
  const [baseIndex, setBaseIndex] = useState(0)

  // AI follow-up questions + answers
  const [aiQuestions, setAiQuestions] = useState<string[]>([])
  const [aiAnswers, setAiAnswers] = useState<string[]>([])
  const [aiIndex, setAiIndex] = useState(0)

  const [result, setResult] = useState<AssessResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Step 1: submit complaint → load base questions ────────────────────
  async function handleComplaintSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!complaint.trim()) return
    setStep('loading-base')
    setError(null)

    try {
      const res = await fetch('/api/triage/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint, language: effectiveLang, stage: 1 }),
      })
      if (!res.ok) throw new Error('Failed to load questions')
      const data = await res.json()
      setBaseQuestions(data.questions)
      setBaseAnswers(new Array(data.questions.length).fill(''))
      setBaseIndex(0)
      setStep('base-questions')
    } catch {
      setError(t('common.error'))
      setStep('complaint')
    }
  }

  // ── Step 2a: answer one base question at a time ───────────────────────
  function handleBaseAnswer(answer: string) {
    const updated = [...baseAnswers]
    updated[baseIndex] = answer
    setBaseAnswers(updated)

    if (baseIndex < baseQuestions.length - 1) {
      setBaseIndex(baseIndex + 1)
    } else {
      // All base questions answered — fetch AI follow-ups
      loadAiQuestions(updated)
    }
  }

  async function loadAiQuestions(answeredBase: string[]) {
    setStep('loading-ai-questions')
    const baseQA = baseQuestions.map((q, i) => ({ question: q, answer: answeredBase[i] || '' }))

    try {
      const res = await fetch('/api/triage/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint,
          language: effectiveLang,
          stage: 2,
          baseAnswers: baseQA,
        }),
      })
      if (!res.ok) throw new Error('Failed to load follow-up questions')
      const data = await res.json()
      setAiQuestions(data.questions)
      setAiAnswers(new Array(data.questions.length).fill(''))
      setAiIndex(0)
      setStep('ai-questions')
    } catch {
      // If AI follow-ups fail, go straight to assessment with base answers only
      await runAssessment(baseQA, [])
    }
  }

  // ── Step 2b: answer one AI question at a time ─────────────────────────
  function handleAiAnswer(answer: string) {
    const updated = [...aiAnswers]
    updated[aiIndex] = answer
    setAiAnswers(updated)

    if (aiIndex < aiQuestions.length - 1) {
      setAiIndex(aiIndex + 1)
    } else {
      const baseQA = baseQuestions.map((q, i) => ({ question: q, answer: baseAnswers[i] || '' }))
      const aiQA = aiQuestions.map((q, j) => ({ question: q, answer: updated[j] || '' }))
      runAssessment(baseQA, aiQA)
    }
  }

  // ── Step 3: run final triage assessment ───────────────────────────────
  async function runAssessment(baseQA: ChecklistItem[], aiQA: ChecklistItem[]) {
    setStep('loading-result')
    setError(null)
    const allAnswers = [...baseQA, ...aiQA]

    try {
      const res = await fetch('/api/triage/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint, allAnswers, language: effectiveLang }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.error || 'Assessment failed')
      }

      const data = await res.json()
      setResult({
        caseId: data.caseId,
        urgency: data.urgency,
        assessment: data.assessment,
        assessmentDetail: data.assessmentDetail,
        recommendedTests: data.recommendedTests,
        immediateAction: data.immediateAction,
        protocolName: data.protocolName,
        aiUnavailable: data.aiUnavailable,
      })
      setStep('result')
    } catch (err) {
      console.error(err)
      setError(t('common.error'))
      setStep('ai-questions')
    }
  }

  // ── Progress dots ─────────────────────────────────────────────────────
  function ProgressDots({ total, current }: { total: number; current: number }) {
    return (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={
              i < current
                ? 'step-dot-done'
                : i === current
                ? 'step-dot-active'
                : 'step-dot'
            }
          />
        ))}
      </div>
    )
  }

  // ── Render: complaint ─────────────────────────────────────────────────
  if (step === 'complaint' || step === 'loading-base') {
    return (
      <div className="space-y-4">
        <div className="card pattern-section pattern-faint">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/10">
              <Activity className="h-5 w-5 text-ember" />
            </div>
            <div>
              <h1 className="font-display text-lg font-extrabold text-ink dark:text-dark-text">
                {t('case.step1Title')}
              </h1>
              <p className="text-xs text-ink/50 dark:text-dark-muted">{t('case.step1Prompt')}</p>
            </div>
          </div>

          <form onSubmit={handleComplaintSubmit} className="space-y-4">
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder={t('case.step1Placeholder')}
              rows={6}
              required
              disabled={step === 'loading-base'}
              className="textarea"
            />

            {error && (
              <p className="rounded-xl bg-urgency-emergency-bg dark:bg-urgency-emergency-dark-bg p-3 text-sm text-urgency-emergency">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={step === 'loading-base' || !complaint.trim()}
              className="btn-primary w-full"
            >
              {step === 'loading-base' ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{t('case.generatingChecklist')}</>
              ) : (
                <>{t('case.continue')}<ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Render: base question (one at a time) ─────────────────────────────
  if (step === 'base-questions') {
    const q = baseQuestions[baseIndex]
    const totalSteps = baseQuestions.length + (aiQuestions.length || 3)

    return (
      <QuestionCard
        question={q}
        currentStep={baseIndex}
        totalSteps={totalSteps}
        onAnswer={handleBaseAnswer}
        onSkip={() => handleBaseAnswer('')}
        t={t}
      />
    )
  }

  // ── Render: loading AI questions ──────────────────────────────────────
  if (step === 'loading-ai-questions') {
    return (
      <div className="card flex flex-col items-center gap-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-ember" />
        <p className="text-sm font-medium text-ink/60 dark:text-dark-muted">
          {t('case.generatingChecklist')}
        </p>
      </div>
    )
  }

  // ── Render: AI follow-up question (one at a time) ─────────────────────
  if (step === 'ai-questions') {
    const q = aiQuestions[aiIndex]
    const totalSteps = baseQuestions.length + aiQuestions.length

    return (
      <QuestionCard
        question={q}
        currentStep={baseQuestions.length + aiIndex}
        totalSteps={totalSteps}
        onAnswer={handleAiAnswer}
        onSkip={() => handleAiAnswer('')}
        t={t}
        isAiGenerated
      />
    )
  }

  // ── Render: loading result ────────────────────────────────────────────
  if (step === 'loading-result') {
    return (
      <div className="card flex flex-col items-center gap-4 py-12 text-center">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-ember" />
          <Activity className="absolute inset-0 m-auto h-4 w-4 text-ember/40" />
        </div>
        <div>
          <p className="font-display text-sm font-bold text-ink dark:text-dark-text">
            {t('case.analyzing')}
          </p>
          <p className="mt-1 text-xs text-ink/50 dark:text-dark-muted">
            {t('case.analyzingDetail')}
          </p>
        </div>
      </div>
    )
  }

  // ── Render: result ────────────────────────────────────────────────────
  if (step === 'result' && result) {
    return (
      <ResultView
        result={result}
        onContinue={() => router.push(`/case/${result.caseId}`)}
        t={t}
      />
    )
  }

  return null
}

// ── QuestionCard: single-question display ─────────────────────────────────
function QuestionCard({
  question,
  currentStep,
  totalSteps,
  onAnswer,
  onSkip,
  t,
  isAiGenerated = false,
}: {
  question: string
  currentStep: number
  totalSteps: number
  onAnswer: (answer: string) => void
  onSkip: () => void
  t: (key: string) => string
  isAiGenerated?: boolean
}) {
  const [answer, setAnswer] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAnswer(answer.trim())
    setAnswer('')
  }

  const progress = Math.round(((currentStep) / totalSteps) * 100)

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-ink/10 dark:bg-dark-border overflow-hidden">
          <div
            className="h-full rounded-full bg-ember transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-ink/40 dark:text-dark-muted tabular-nums">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>

      <div className="card">
        {isAiGenerated && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-ember/10 px-2.5 py-1">
            <Zap className="h-3 w-3 text-ember" />
            <span className="text-xs font-semibold text-ember">{t('case.aiFollowUp')}</span>
          </div>
        )}

        <p className="font-display text-base font-bold text-ink dark:text-dark-text leading-snug mb-4">
          {question}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('case.answerPlaceholder')}
            rows={3}
            className="textarea"
            autoFocus
          />

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              {t('case.next')}
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="btn-ghost px-4"
            >
              {t('case.skip')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── ResultView: rich triage result ───────────────────────────────────────
function ResultView({
  result,
  onContinue,
  t,
}: {
  result: AssessResult
  onContinue: () => void
  t: (key: string) => string
}) {
  const config = URGENCY_CONFIG[result.urgency]
  const Icon = config.icon

  return (
    <div className="space-y-4">
      {/* Main urgency card — the signature element */}
      <div className={`rounded-2xl border-2 ${config.border} ${config.bg} ${config.darkBg} pattern-section pattern-medium overflow-hidden`}>
        <div className="p-5">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-ink/40 dark:text-dark-muted mb-3">
            {t('case.resultTitle')}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-dark-card/80 shadow-card">
              <Icon className={`h-7 w-7 ${config.color}`} />
            </div>
            <div>
              <h2 className={`font-display text-3xl font-extrabold ${config.color}`}>
                {t(`case.urgency.${result.urgency}`)}
              </h2>
              {result.protocolName && (
                <p className="mt-0.5 text-xs font-semibold text-ink/50 dark:text-dark-muted">
                  {result.protocolName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assessment — personalised, patient-facing */}
      <div className="card">
        <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-widest text-ink/40 dark:text-dark-muted">
          {t('case.assessmentSummary')}
        </h3>
        <p className="text-sm leading-relaxed text-ink/80 dark:text-dark-text">
          {result.assessment}
        </p>
        {result.assessmentDetail && (
          <p className="mt-3 text-sm leading-relaxed text-ink/60 dark:text-dark-muted">
            {result.assessmentDetail}
          </p>
        )}
      </div>

      {/* Immediate action */}
      {result.immediateAction && (
        <div className="card border-ember/20 bg-ember/5 dark:bg-ember/10">
          <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-ember">
            <Zap className="h-3.5 w-3.5" />
            {t('case.immediateAction')}
          </h3>
          <p className="text-sm leading-relaxed text-ink/80 dark:text-dark-text">
            {result.immediateAction}
          </p>
        </div>
      )}

      {/* Recommended tests */}
      {result.recommendedTests.length > 0 && (
        <div className="card">
          <h3 className="mb-3 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-ink/40 dark:text-dark-muted">
            <FlaskConical className="h-3.5 w-3.5 text-ember" />
            {t('case.recommendedTests')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {result.recommendedTests.map((test, i) => (
              <li
                key={i}
                className="rounded-full border border-ember/20 bg-ember/5 dark:bg-ember/10 px-3 py-1.5 text-sm font-medium text-ember dark:text-ember-light"
              >
                {test}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI unavailable notice */}
      {result.aiUnavailable && (
        <p className="rounded-xl bg-urgency-urgent-bg dark:bg-urgency-urgent-dark-bg px-4 py-3 text-xs text-urgency-urgent">
          {t('case.aiUnavailableNotice')}
        </p>
      )}

      <button onClick={onContinue} className="btn-primary w-full">
        {t('case.goToCase')}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

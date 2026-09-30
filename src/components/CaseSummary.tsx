// triiosan-batch5 marker: https://triiosan.dev/b5/case-summary
'use client'

import { AlertTriangle, Clock, CheckCircle2, FlaskConical } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { ChecklistItem, TriageCase } from '@/lib/supabase/types'

const URGENCY_CONFIG = {
  emergency: { icon: AlertTriangle, color: 'text-urgency-emergency', bg: 'bg-urgency-emergency-bg dark:bg-urgency-emergency-dark-bg', border: 'border-urgency-emergency/30' },
  urgent: { icon: Clock, color: 'text-urgency-urgent', bg: 'bg-urgency-urgent-bg dark:bg-urgency-urgent-dark-bg', border: 'border-urgency-urgent/30' },
  routine: { icon: CheckCircle2, color: 'text-urgency-routine', bg: 'bg-urgency-routine-bg dark:bg-urgency-routine-dark-bg', border: 'border-urgency-routine/30' },
} as const

const LABEL = 'font-display text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-dark-muted'

export function CaseSummary({
  triageCase,
  patientName,
}: {
  triageCase: TriageCase
  /** When provided (clinician view), shows who this case belongs to. */
  patientName?: string
}) {
  const { t } = useLanguage()

  const config = triageCase.urgency ? URGENCY_CONFIG[triageCase.urgency] : null
  const Icon = config?.icon

  // The database column is checklist_qa. Older rows may carry a legacy
  // `checklist` field, so read both defensively and never assume either exists.
  const legacy = (triageCase as unknown as { checklist?: ChecklistItem[] | null }).checklist
  const checklist: ChecklistItem[] =
    (triageCase.checklist_qa && triageCase.checklist_qa.length > 0
      ? triageCase.checklist_qa
      : legacy) ?? []
  const tests: string[] = triageCase.recommended_tests ?? []

  return (
    <div className="space-y-3">
      {/* Patient identity — clinician view only */}
      {patientName && (
        <div className="card flex items-center justify-between">
          <span className={LABEL}>{t('clinician.patientInfo')}</span>
          <span className="text-sm font-semibold text-ink dark:text-dark-text">{patientName}</span>
        </div>
      )}

      {/* Urgency badge (triage colours, unchanged) */}
      {config && Icon && (
        <div className={`flex items-center gap-2 rounded-xl border ${config.border} ${config.bg} px-4 py-3`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className={`font-display text-sm font-bold ${config.color}`}>
            {t(`case.urgency.${triageCase.urgency}`)}
          </span>
        </div>
      )}

      {/* Primary complaint */}
      <div className="card">
        <h3 className={`mb-1.5 ${LABEL}`}>{t('thread.yourComplaint')}</h3>
        <p className="text-sm leading-relaxed text-ink/80 dark:text-dark-text">
          {triageCase.primary_complaint}
        </p>
      </div>

      {/* Checklist Q&A */}
      {checklist.length > 0 && (
        <div className="card">
          <h3 className={`mb-2 ${LABEL}`}>{t('thread.checklist')}</h3>
          <dl className="space-y-2">
            {checklist.map((item, i) => (
              <div key={i}>
                <dt className="text-xs font-medium text-ink/60 dark:text-dark-muted">{item.question}</dt>
                <dd className="text-sm text-ink/80 dark:text-dark-text">{item.answer || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Recommended tests */}
      {tests.length > 0 && (
        <div className="card">
          <h3 className={`mb-2 flex items-center gap-2 ${LABEL}`}>
            <FlaskConical className="h-3.5 w-3.5 text-indigo dark:text-indigo-light" />
            {t('thread.recommendedTests')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {tests.map((test, i) => (
              <li
                key={i}
                className="rounded-full border border-indigo/25 bg-indigo-tint px-3 py-1 text-xs font-medium text-indigo dark:border-indigo-light/30 dark:bg-indigo/15 dark:text-indigo-light"
              >
                {test}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Appointment info, if scheduled */}
      {triageCase.appointment_facility && (
        <div className="rounded-2xl border-2 border-ink bg-marigold-tint p-5 shadow-pop-sm dark:border-dark-text dark:bg-dark-card">
          <h3 className="mb-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink dark:text-marigold">
            {t('thread.appointmentTitle')}
          </h3>
          <p className="text-sm font-semibold text-ink dark:text-dark-text">{triageCase.appointment_facility}</p>
          {triageCase.appointment_purpose && (
            <p className="mt-1 text-sm text-ink/70 dark:text-dark-muted">
              {t('thread.appointmentFor')}: {triageCase.appointment_purpose}
            </p>
          )}
          {triageCase.appointment_datetime && (
            <p className="mt-1 text-sm text-ink/70 dark:text-dark-muted">
              {new Date(triageCase.appointment_datetime).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

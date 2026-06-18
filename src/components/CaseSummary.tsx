'use client'

import { AlertTriangle, Clock, CheckCircle2, FlaskConical } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TriageCase } from '@/lib/supabase/types'

const URGENCY_CONFIG = {
  emergency: { icon: AlertTriangle, color: 'text-urgency-emergency', bg: 'bg-urgency-emergency-bg', border: 'border-urgency-emergency/30' },
  urgent: { icon: Clock, color: 'text-urgency-urgent', bg: 'bg-urgency-urgent-bg', border: 'border-urgency-urgent/30' },
  routine: { icon: CheckCircle2, color: 'text-urgency-routine', bg: 'bg-urgency-routine-bg', border: 'border-urgency-routine/30' },
} as const

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

  return (
    <div className="space-y-3">
      {/* Patient identity — clinician view only */}
      {patientName && (
        <div className="card flex items-center justify-between">
          <span className="font-display text-xs font-bold uppercase tracking-wide text-ink/40">
            {t('clinician.patientInfo')}
          </span>
          <span className="text-sm font-semibold text-ink">{patientName}</span>
        </div>
      )}

      {/* Urgency badge */}
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
        <h3 className="mb-1.5 font-display text-xs font-bold uppercase tracking-wide text-ink/40">
          {t('thread.yourComplaint')}
        </h3>
        <p className="text-sm leading-relaxed text-ink/80">{triageCase.primary_complaint}</p>
      </div>

      {/* Checklist Q&A */}
      {triageCase.checklist.length > 0 && (
        <div className="card">
          <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink/40">
            {t('thread.checklist')}
          </h3>
          <dl className="space-y-2">
            {triageCase.checklist.map((item, i) => (
              <div key={i}>
                <dt className="text-xs font-medium text-ink/50">{item.question}</dt>
                <dd className="text-sm text-ink/80">{item.answer || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

           {triageCase.checklist_qa.length > 0 && (
        <div className="card">
          <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-ink/40">
            {t('thread.checklist')}
          </h3>
          <dl className="space-y-2">
            {triageCase.checklist_qa.map((item, i) => (
              <div key={i}>
                <dt className="text-xs font-medium text-ink/50">{item.question}</dt>
                <dd className="text-sm text-ink/80">{item.answer || '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Recommended tests */}
      {triageCase.recommended_tests.length > 0 && (
        <div className="card">
          <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wide text-ink/40">
            <FlaskConical className="h-3.5 w-3.5 text-ember" />
            {t('thread.recommendedTests')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {triageCase.recommended_tests.map((test, i) => (
              <li
                key={i}
                className="rounded-full border border-ember/20 bg-ember-50 px-3 py-1 text-xs font-medium text-ember-dark"
              >
                {test}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Appointment info, if scheduled */}
      {triageCase.appointment_facility && (
        <div className="card border-ember/20 bg-ember-50">
          <h3 className="mb-1.5 font-display text-xs font-bold uppercase tracking-wide text-ember-dark">
            {t('thread.appointmentTitle')}
          </h3>
          <p className="text-sm font-medium text-ink">{triageCase.appointment_facility}</p>
          {triageCase.appointment_purpose && (
            <p className="mt-1 text-sm text-ink/70">
              {t('thread.appointmentFor')}: {triageCase.appointment_purpose}
            </p>
          )}
          {triageCase.appointment_datetime && (
            <p className="mt-1 text-sm text-ink/70">
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

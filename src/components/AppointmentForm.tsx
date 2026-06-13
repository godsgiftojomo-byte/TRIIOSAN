'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const FACILITY_KEYS = [
  'facility.ooutch',
  'facility.ghIkenne',
  'facility.ghSagamu',
  'facility.phcRemo',
] as const

/** 24 hours from now, rounded to the next hour, formatted for a
 * `datetime-local` input (YYYY-MM-DDTHH:mm, local time, no timezone). */
function getDefaultDatetime(): string {
  const d = new Date()
  d.setHours(d.getHours() + 24, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function AppointmentForm({ caseId }: { caseId: string }) {
  const { t } = useLanguage()
  const router = useRouter()

  const [facility, setFacility] = useState('')
  const [purpose, setPurpose] = useState('')
  const [datetime, setDatetime] = useState(getDefaultDatetime)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!facility || !purpose.trim() || !datetime) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/cases/${caseId}/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facility,
          purpose: purpose.trim(),
          // datetime-local input has no timezone — interpret as the
          // clinician's local time and convert to an ISO string.
          datetime: new Date(datetime).toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to schedule appointment')
      }

      // Refresh the page to show the closed state, appointment card,
      // and the now-disabled message thread.
      router.refresh()
    } catch (err) {
      console.error(err)
      setError(t('common.error'))
      setSubmitting(false)
    }
  }

  return (
    <div className="card border-ember/20">
      <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
        <CalendarCheck className="h-4 w-4 text-ember" />
        {t('clinician.scheduleAppointment')}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">
            {t('clinician.appointmentFacility')}
            <span className="text-ember"> *</span>
          </span>
          <select
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            required
            disabled={submitting}
            className="input"
          >
            <option value="" disabled>
              —
            </option>
            {FACILITY_KEYS.map((key) => (
              <option key={key} value={t(key)}>
                {t(key)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">
            {t('clinician.appointmentPurpose')}
            <span className="text-ember"> *</span>
          </span>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={t('clinician.appointmentPurposePlaceholder')}
            rows={3}
            required
            disabled={submitting}
            className="textarea"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">
            {t('clinician.appointmentDate')}
            <span className="text-ember"> *</span>
          </span>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            required
            disabled={submitting}
            className="input"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-urgency-emergency-bg p-3 text-sm text-urgency-emergency">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !facility || !purpose.trim()}
          className="btn-primary w-full sm:w-auto"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CalendarCheck className="h-4 w-4" />
          )}
          {t('clinician.confirmClose')}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck, Loader2, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Urgency, Cadre, DistanceBand } from '@/lib/supabase/types'
import { cadreForProtocol, canBeScheduled } from '@/lib/triage/cadre'

/**
 * Replaces src/components/AppointmentForm.tsx in full.
 *
 * WHAT WAS DELETED AND WHY
 *
 * getDefaultDatetime() is gone. It pre-filled the input with 24
 * hours from now, rounded to the next hour. Under a busy clinic
 * that means clinicians clicking through with whatever it
 * suggested, which is how a facility ends up block-booking half
 * its patients into one window. The fix is not a better default.
 * It is removing the free date field entirely.
 *
 * FACILITY_KEYS is gone. It hardcoded four Ogun State facilities
 * while the pilot is General Hospital Ikorodu in Lagos.
 *
 * The clinician now picks from windows that exist and have a free
 * seat. Nothing else is offerable.
 */

interface Facility {
  id: string
  name: string
  lga: string
}

interface Slot {
  id: string
  slot_date: string
  window_start: string
  window_end: string
  cadre: Cadre
  seats_left: number
  distance_band: DistanceBand | null
}

function formatWindow(slot: Slot): string {
  const date = new Date(slot.slot_date + 'T00:00:00')
  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const trim = (t: string) => t.slice(0, 5)
  return `${day}, ${trim(slot.window_start)} – ${trim(slot.window_end)}`
}

export function AppointmentForm({
  caseId,
  urgency,
  matchedProtocolId,
  originBand,
}: {
  caseId: string
  urgency: Urgency | null
  matchedProtocolId: string | null
  /** From the patient's stated area of residence, if we have it. */
  originBand?: DistanceBand
}) {
  const { t } = useLanguage()
  const router = useRouter()

  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityId, setFacilityId] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotId, setSlotId] = useState('')
  const [purpose, setPurpose] = useState('')

  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cadre = cadreForProtocol(matchedProtocolId)
  const schedulable = canBeScheduled(urgency)

  // --------------------------------------------------------
  // Emergency cases never reach a booking screen.
  // --------------------------------------------------------
  if (!schedulable) {
    return (
      <div className="card border-urgency-emergency/30 bg-urgency-emergency-bg">
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-urgency-emergency">
          <AlertTriangle className="h-4 w-4" />
          {t('clinician.emergencyNoBooking')}
        </h3>
        <p className="text-sm text-ink/80">
          {t('clinician.emergencyNoBookingBody')}
        </p>
      </div>
    )
  }

  useEffect(() => {
    fetch('/api/facilities')
      .then((r) => r.json())
      .then((d) => {
        setFacilities(d.facilities ?? [])
        if (d.facilities?.length === 1) setFacilityId(d.facilities[0].id)
      })
      .catch(() => setError(t('common.error')))
  }, [t])

  const loadSlots = useCallback(async () => {
    if (!facilityId) return
    setLoadingSlots(true)
    setSlotId('')

    const qs = new URLSearchParams({ cadre })
    if (originBand) qs.set('band', originBand)

    // Urgent cases are same-day only.
    if (urgency === 'urgent') {
      const today = new Date().toISOString().slice(0, 10)
      qs.set('from', today)
      qs.set('to', today)
    }

    try {
      const res = await fetch(`/api/facilities/${facilityId}/slots?${qs}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch {
      setError(t('common.error'))
    } finally {
      setLoadingSlots(false)
    }
  }, [facilityId, cadre, originBand, urgency, t])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slotId) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/cases/${caseId}/appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, purpose: purpose.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))

        // Someone else took the last seat between load and submit.
        // Refresh the list rather than showing a dead end.
        if (data?.error === 'SLOT_FULL') {
          setError(data.message)
          await loadSlots()
          setSubmitting(false)
          return
        }

        throw new Error(data?.message || data?.error || 'Failed to schedule')
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t('common.error'))
      setSubmitting(false)
    }
  }

  return (
    <div className="card border-teal/20">
      <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink/50">
        <CalendarCheck className="h-4 w-4 text-teal" />
        {t('clinician.scheduleAppointment')}
      </h3>

      <p className="mb-4 text-xs text-ink/60">
        {t('clinician.cadreNote')}: <strong>{cadre}</strong>
        {urgency === 'urgent' && ` · ${t('clinician.sameDayOnly')}`}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">
            {t('clinician.appointmentFacility')}
            <span className="text-teal"> *</span>
          </span>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            required
            disabled={submitting}
            className="input"
          >
            <option value="" disabled>
              —
            </option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.lga})
              </option>
            ))}
          </select>
        </label>

        <div className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">
            {t('clinician.appointmentWindow')}
            <span className="text-teal"> *</span>
          </span>

          {loadingSlots ? (
            <div className="flex items-center gap-2 py-3 text-sm text-ink/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-lg bg-ink/5 p-3 text-sm text-ink/60">
              {facilityId
                ? t('clinician.noSlotsAvailable')
                : t('clinician.selectFacilityFirst')}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlotId(s.id)}
                  disabled={submitting}
                  className={`rounded-xl border p-3 text-left text-sm transition ${
                    slotId === s.id
                      ? 'border-teal bg-teal/10 text-ink'
                      : 'border-ink/10 hover:border-teal/40'
                  }`}
                >
                  <span className="block font-medium">{formatWindow(s)}</span>
                  <span className="block text-xs text-ink/50">
                    {s.seats_left} {t('clinician.seatsLeft')}
                    {s.distance_band ? ` · ${s.distance_band}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink/80">
            {t('clinician.appointmentPurpose')}
          </span>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={t('clinician.appointmentPurposePlaceholder')}
            rows={3}
            disabled={submitting}
            className="textarea"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-urgency-emergency-bg p-3 text-sm text-urgency-emergency">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !slotId}
          className="btn-primary w-full sm:w-auto"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CalendarCheck className="h-4 w-4" />
          )}
          {t('clinician.confirmBooking')}
        </button>
      </form>
    </div>
  )
}

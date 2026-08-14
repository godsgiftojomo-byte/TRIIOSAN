/**
 * src/lib/triage/cadre.ts
 *
 * Which kind of health worker should see this case, and how soon.
 *
 * WHY THIS FILE EXISTS
 * We cannot create doctors. Lagos has roughly 7,000 against a
 * stated need of around 40,000. What we can do is stop spending
 * the ones there are on cases a nurse or a community health
 * extension worker can handle safely.
 *
 * That is the whole of our answer to the workforce shortage, and
 * it lives in this file.
 *
 * WHO OWNS THIS FILE
 * A clinician, not an engineer. The mapping below is a starting
 * proposal drawn from the protocol severity, and it must be
 * reviewed and signed off by the clinical lead at the pilot site
 * before go-live. Do not change an entry because it makes a
 * queue shorter.
 */

import type { Cadre, Urgency } from '@/lib/supabase/types'

/**
 * Every emergency protocol is doctor-only by definition, because
 * an emergency case never reaches booking at all. They are listed
 * anyway so that nothing falls through to the default.
 */
export const PROTOCOL_CADRE: Record<string, Cadre> = {
  // Emergency protocols. Never booked. Listed for completeness.
  'respiratory-distress':    'doctor',
  'chest-pain-cardiac':      'doctor',
  'stroke-signs':            'doctor',
  'obstetric-emergency':     'doctor',
  'severe-dehydration':      'doctor',
  'meningitis-signs':        'doctor',
  'paediatric-severe-fever': 'doctor',

  // Needs a doctor's assessment even when not immediately urgent.
  'hypertensive-urgency':    'doctor',
  'diabetic-concern':        'doctor',
  'acute-abdomen':           'doctor',
  'mental-health-crisis':    'doctor',

  // Can safely start with a nurse under standing orders, with
  // escalation to a doctor if findings warrant it.
  'malaria-suspected':       'nurse',
  'typhoid-suspected':       'nurse',
  'urinary-infection':       'nurse',
}

/**
 * When no protocol matched, we do not know what we are dealing
 * with. Send it to a doctor. The cost of a wasted doctor slot is
 * lower than the cost of a missed diagnosis.
 */
export const DEFAULT_CADRE: Cadre = 'doctor'

export function cadreForProtocol(protocolId: string | null): Cadre {
  if (!protocolId) return DEFAULT_CADRE
  return PROTOCOL_CADRE[protocolId] ?? DEFAULT_CADRE
}

/**
 * How far ahead a case may be booked.
 *
 * `null` means no booking is permitted at all. Emergency cases
 * are told to go to hospital now. They are flagged to a clinician
 * but never given a slot, and book_slot() rejects them at the
 * database level as well so no future caller can route around it.
 */
export function bookingHorizonDays(urgency: Urgency | null): number | null {
  switch (urgency) {
    case 'emergency':
      return null
    case 'urgent':
      return 0 // same day only
    case 'routine':
      return 14
    default:
      // Untriaged or unknown. Treat cautiously: same-day review.
      return 0
  }
}

export function canBeScheduled(urgency: Urgency | null): boolean {
  return bookingHorizonDays(urgency) !== null
}

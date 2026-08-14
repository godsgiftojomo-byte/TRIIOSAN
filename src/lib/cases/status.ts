/**
 * src/lib/cases/status.ts
 *
 * WHY THIS FILE EXISTS
 *
 * The case lifecycle used to be two states, open and closed, so
 * `status === 'open'` was a safe shorthand for "still live" and it
 * got written in six different places.
 *
 * It is five states now. Every one of those six comparisons still
 * compiles and every one of them is now wrong, because a scheduled
 * case is neither open nor closed. Adding members to a TypeScript
 * union does not break equality checks, so nothing warns you.
 *
 * Use these helpers instead of comparing status literals. When the
 * lifecycle changes again, it changes here and nowhere else.
 */

import type { CaseStatus } from '@/lib/supabase/types'

/** Still moving through the system. Shows on dashboards and queues. */
export const ACTIVE_STATUSES: CaseStatus[] = ['open', 'scheduled']

/** Finished, one way or another. */
export const TERMINAL_STATUSES: CaseStatus[] = ['attended', 'no_show', 'closed']

/** Not yet booked. This is the clinician's work queue. */
export const UNBOOKED_STATUSES: CaseStatus[] = ['open']

export function isActive(status: CaseStatus): boolean {
  return ACTIVE_STATUSES.includes(status)
}

export function isTerminal(status: CaseStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

/** Can this case still be given a slot? */
export function isBookable(status: CaseStatus): boolean {
  return status === 'open'
}

/** Should the patient still be able to message about this case? */
export function isThreadOpen(status: CaseStatus): boolean {
  return isActive(status)
}

/**
 * Translation key for a status badge. Add these five to all five
 * language blocks in translations.ts.
 */
export function statusLabelKey(status: CaseStatus): string {
  switch (status) {
    case 'open':
      return 'thread.statusOpen'
    case 'scheduled':
      return 'thread.statusScheduled'
    case 'attended':
      return 'thread.statusAttended'
    case 'no_show':
      return 'thread.statusNoShow'
    case 'closed':
      return 'thread.statusClosed'
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canBeScheduled, bookingHorizonDays, cadreForProtocol } from '@/lib/triage/cadre'
import type { BookedBy } from '@/lib/supabase/types'

/**
 * POST /api/cases/[id]/appointment
 *
 * Replaces the old route in full.
 *
 * WHAT CHANGED AND WHY
 *
 * 1. It takes a slot_id, not a free datetime. The old route
 *    accepted whatever a clinician typed into a datetime-local
 *    input. Nothing stopped every patient being booked at 08:00
 *    on the same day, which is exactly the block-booking that a
 *    Nigerian ultrasound unit audit found: 51% of patients given
 *    the same 08:00 appointment, 132 minutes average wait, and
 *    shorter waits for anyone who turned up after 11:00. The old
 *    code reproduced the problem this product exists to solve.
 *
 * 2. It sets status to 'scheduled', not 'closed'. Closing the case
 *    at booking lost the patient at the exact moment we needed to
 *    start following them, which made arrival time, consultation
 *    start and attendance unrecordable. Those are the pilot's
 *    primary outcome.
 *
 * 3. Emergency cases are refused. They never get a slot. They are
 *    told to go now. book_slot() enforces this at the database
 *    level too, so no future caller can route around it.
 *
 * 4. Booking goes through book_slot(), which increments the seat
 *    count inside the database. Checking capacity in application
 *    code lets two simultaneous requests both take the last seat.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, verification_status')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const isClinician =
    profile.role === 'clinician' && profile.verification_status === 'verified'
  const isClerk = profile.role === 'clerk'

  if (!isClinician && !isClerk) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const bookedBy: BookedBy = isClerk ? 'clerk' : 'clinician'

  const body = await request.json().catch(() => ({}))
  const slotId: string = (body?.slot_id || '').trim()
  const purpose: string = (body?.purpose || '').trim()

  if (!slotId) {
    return NextResponse.json({ error: 'slot_id is required' }, { status: 400 })
  }

  // ----------------------------------------------------------
  // Load the case and gate on urgency
  // ----------------------------------------------------------

  const { data: existingCase, error: caseError } = await supabase
    .from('triage_cases')
    .select('id, status, urgency, matched_protocol_id, assigned_clinician_id')
    .eq('id', params.id)
    .single()

  if (caseError || !existingCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  if (!canBeScheduled(existingCase.urgency)) {
    return NextResponse.json(
      {
        error: 'EMERGENCY_CANNOT_BE_SCHEDULED',
        message:
          'This case is flagged as an emergency. It must not be given an appointment. Direct the patient to the nearest facility now.',
      },
      { status: 409 }
    )
  }

  if (['closed', 'attended', 'no_show'].includes(existingCase.status)) {
    return NextResponse.json({ error: 'Case is not bookable' }, { status: 409 })
  }

  // ----------------------------------------------------------
  // Check the slot fits the urgency horizon and the cadre
  // ----------------------------------------------------------

  const { data: slot, error: slotError } = await supabase
    .from('appointment_slots')
    .select('id, slot_date, window_start, window_end, cadre, facility_id')
    .eq('id', slotId)
    .single()

  if (slotError || !slot) {
    return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
  }

  const horizon = bookingHorizonDays(existingCase.urgency)
  if (horizon !== null) {
    const latest = new Date()
    latest.setDate(latest.getDate() + horizon)
    if (new Date(slot.slot_date) > latest) {
      return NextResponse.json(
        {
          error: 'SLOT_TOO_FAR_OUT',
          message:
            horizon === 0
              ? 'Urgent cases must be booked for today.'
              : `This case must be booked within ${horizon} days.`,
        },
        { status: 409 }
      )
    }
  }

  const expectedCadre = cadreForProtocol(existingCase.matched_protocol_id)
  if (slot.cadre !== expectedCadre && slot.cadre !== 'doctor') {
    // Booking up to a doctor is always allowed. Booking down to a
    // lesser cadre than the protocol calls for is not.
    return NextResponse.json(
      {
        error: 'CADRE_MISMATCH',
        message: `This case should be seen by: ${expectedCadre}.`,
      },
      { status: 409 }
    )
  }

  // ----------------------------------------------------------
  // Book, atomically, inside the database
  // ----------------------------------------------------------

  const { error: bookError } = await supabase.rpc('book_slot', {
    p_slot_id: slotId,
    p_case_id: params.id,
    p_booked_by: bookedBy,
  })

  if (bookError) {
    const msg = bookError.message || ''

    if (msg.includes('SLOT_FULL')) {
      return NextResponse.json(
        { error: 'SLOT_FULL', message: 'That window just filled. Pick another.' },
        { status: 409 }
      )
    }
    if (msg.includes('EMERGENCY_CANNOT_BE_SCHEDULED')) {
      return NextResponse.json({ error: 'EMERGENCY_CANNOT_BE_SCHEDULED' }, { status: 409 })
    }

    console.error('book_slot error:', bookError)
    return NextResponse.json({ error: 'Failed to schedule appointment' }, { status: 500 })
  }

  // ----------------------------------------------------------
  // Attach purpose and clinician. Status is already 'scheduled',
  // set inside book_slot().
  // ----------------------------------------------------------

  const { data: updatedCase, error: updateError } = await supabase
    .from('triage_cases')
    .update({
      appointment_purpose: purpose || null,
      assigned_clinician_id:
        existingCase.assigned_clinician_id ||
        (isClinician ? authData.user.id : null),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (updateError || !updatedCase) {
    console.error('appointment metadata update error:', updateError)
    // The booking itself succeeded, so do not fail the request.
    return NextResponse.json({ ok: true, warning: 'Booked, but purpose was not saved' })
  }

  return NextResponse.json({ case: updatedCase, slot })
}


/**
 * DELETE /api/cases/[id]/appointment
 *
 * Cancels a booking and returns the seat to the pool. Without
 * this, a cancelled appointment leaves a phantom booking and the
 * session looks full while people are turned away.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, verification_status')
    .eq('id', authData.user.id)
    .single()

  const allowed =
    profile &&
    ((profile.role === 'clinician' && profile.verification_status === 'verified') ||
      profile.role === 'clerk')

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.rpc('release_slot', { p_case_id: params.id })

  if (error) {
    console.error('release_slot error:', error)
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

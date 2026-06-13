import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Clinician action: schedule an appointment and close the case.
 *
 * - Requires an authenticated, VERIFIED clinician.
 * - Sets appointment_facility, appointment_purpose, appointment_datetime.
 * - Sets status = 'closed' and assigned_clinician_id = current clinician
 *   (if not already assigned).
 * - The case (and its message thread) remains visible to the patient for
 *   reference, but MessageThread is rendered with `disabled` once closed —
 *   per spec, a closed case cannot be reopened; the patient starts a new
 *   check-in for any further concern.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Confirm the caller is a verified clinician
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, verification_status')
    .eq('id', authData.user.id)
    .single()

  if (
    profileError ||
    !profile ||
    profile.role !== 'clinician' ||
    profile.verification_status !== 'verified'
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const facility: string = (body?.facility || '').trim()
  const purpose: string = (body?.purpose || '').trim()
  const datetime: string = (body?.datetime || '').trim()

  if (!facility || !purpose || !datetime) {
    return NextResponse.json(
      { error: 'facility, purpose, and datetime are all required' },
      { status: 400 }
    )
  }

  // Basic ISO datetime sanity check
  const parsedDate = new Date(datetime)
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid datetime' }, { status: 400 })
  }

  // Confirm the case exists and is currently open before closing it
  const { data: existingCase, error: caseError } = await supabase
    .from('triage_cases')
    .select('id, status, assigned_clinician_id')
    .eq('id', params.id)
    .single()

  if (caseError || !existingCase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  if (existingCase.status === 'closed') {
    return NextResponse.json({ error: 'Case is already closed' }, { status: 409 })
  }

  const { data: updatedCase, error: updateError } = await supabase
    .from('triage_cases')
    .update({
      appointment_facility: facility,
      appointment_purpose: purpose,
      appointment_datetime: parsedDate.toISOString(),
      status: 'closed',
      assigned_clinician_id: existingCase.assigned_clinician_id || authData.user.id,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (updateError || !updatedCase) {
    console.error('appointment update error:', updateError)
    return NextResponse.json({ error: 'Failed to schedule appointment' }, { status: 500 })
  }

  return NextResponse.json({ case: updatedCase })
}

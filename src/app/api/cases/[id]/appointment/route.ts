import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Profile, TriageCase } from '@/lib/supabase/types'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profileRaw, error: profileError } = await supabase
    .from('profiles')
    .select('role, verification_status')
    .eq('id', authData.user.id)
    .single()

  const profile = profileRaw as Pick<Profile, 'role' | 'verification_status'> | null

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

  const parsedDate = new Date(datetime)
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid datetime' }, { status: 400 })
  }

  const { data: existingCaseRaw, error: caseError } = await supabase
    .from('triage_cases')
    .select('id, status, assigned_clinician_id')
    .eq('id', params.id)
    .single()

  const existingCase = existingCaseRaw as Pick<TriageCase, 'id' | 'status' | 'assigned_clinician_id'> | null

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

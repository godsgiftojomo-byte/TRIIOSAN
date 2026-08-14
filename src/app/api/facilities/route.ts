import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/facilities
 *
 * Replaces the FACILITY_KEYS constant that used to be hardcoded in
 * AppointmentForm.tsx. That list held four Ogun State facilities
 * while every piece of research behind this product is Lagos, and
 * the pilot site is General Hospital Ikorodu.
 *
 * Facilities are rows now because slots hang off them.
 */
export async function GET() {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('facilities')
    .select('id, name, lga, state, session_start, session_end')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('facilities fetch error:', error)
    return NextResponse.json({ error: 'Failed to load facilities' }, { status: 500 })
  }

  return NextResponse.json({ facilities: data ?? [] })
}

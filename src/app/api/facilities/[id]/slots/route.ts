import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Cadre, DistanceBand } from '@/lib/supabase/types'

/**
 * GET /api/facilities/[id]/slots
 *
 * Query params:
 *   from    YYYY-MM-DD   default today
 *   to      YYYY-MM-DD   default from + 14
 *   cadre   doctor|nurse|chew          optional
 *   band    near|mid|far               optional
 *
 * Returns only slots with a free seat.
 *
 * A slot with distance_band = null is open to anyone. A slot with
 * a band set is reserved for patients travelling from that band,
 * which is how arrivals get staggered by journey length rather
 * than everyone being told to come at once.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const today = new Date().toISOString().slice(0, 10)

  const from = url.searchParams.get('from') || today
  const to =
    url.searchParams.get('to') ||
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)

  const cadre = url.searchParams.get('cadre') as Cadre | null
  const band = url.searchParams.get('band') as DistanceBand | null

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
  }

  let query = supabase
    .from('appointment_slots')
    .select('id, facility_id, slot_date, window_start, window_end, cadre, capacity, booked_count, distance_band')
    .eq('facility_id', params.id)
    .gte('slot_date', from)
    .lte('slot_date', to)
    .order('slot_date')
    .order('window_start')

  if (cadre) query = query.eq('cadre', cadre)

  // A banded slot is only offered to patients in that band.
  // Unbanded slots are offered to everyone.
  if (band) query = query.or(`distance_band.is.null,distance_band.eq.${band}`)

  const { data, error } = await query

  if (error) {
    console.error('slots fetch error:', error)
    return NextResponse.json({ error: 'Failed to load slots' }, { status: 500 })
  }

  // Filter to slots with a free seat. Doing this here rather than
  // in SQL keeps the comparison between two columns simple.
  const available = (data ?? [])
    .filter((s) => s.booked_count < s.capacity)
    .map((s) => ({ ...s, seats_left: s.capacity - s.booked_count }))

  return NextResponse.json({ slots: available })
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { validateAdminToken } from '@/lib/auth/adminTokens'

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!validateAdminToken(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient()

  const [casesRes, profilesRes, messagesRes] = await Promise.all([
    (supabase.from('triage_cases') as any).select(
      'id, urgency, status, booked_by, actual_arrival_time, consultation_start_time, created_at'
    ),
    (supabase.from('profiles') as any).select('id, role, verification_status, created_at'),
    (supabase.from('case_messages') as any).select('id, created_at'),
  ])

  const cases = casesRes.data || []
  const profiles = profilesRes.data || []

  const attended = cases.filter((c: any) => c.status === 'attended').length
  const noShow = cases.filter((c: any) => c.status === 'no_show').length

  const stats = {
    totalCases: cases.length,

    // The lifecycle has five states now. The old two-bucket count
    // silently dropped every scheduled case, which is the one state
    // the pilot most needs to see.
    openCases: cases.filter((c: any) => c.status === 'open').length,
    scheduledCases: cases.filter((c: any) => c.status === 'scheduled').length,
    attendedCases: attended,
    noShowCases: noShow,
    closedCases: cases.filter((c: any) => c.status === 'closed').length,

    // Pilot metrics. Surface them here rather than working them out
    // by hand later.
    attendanceRate: attended + noShow > 0 ? attended / (attended + noShow) : null,
    selfBookedShare: selfBookedShare(cases),
    medianWaitMinutes: medianWait(cases),

    emergency: cases.filter((c: any) => c.urgency === 'emergency').length,
    urgent: cases.filter((c: any) => c.urgency === 'urgent').length,
    routine: cases.filter((c: any) => c.urgency === 'routine').length,
    totalPatients: profiles.filter((p: any) => p.role === 'patient').length,
    totalClinicians: profiles.filter((p: any) => p.role === 'clinician').length,
    totalClerks: profiles.filter((p: any) => p.role === 'clerk').length,
    pendingClinicians: profiles.filter((p: any) => p.role === 'clinician' && p.verification_status === 'pending').length,
    totalMessages: messagesRes.data?.length || 0,
    recentActivity: getLast14Days(cases),
  }

  return NextResponse.json({ stats })
}

/**
 * Share of bookings the patient made themselves rather than a clerk.
 * Watching this rise is how we know the assisted-booking hand-off is
 * actually converting into self-service.
 */
function selfBookedShare(cases: { booked_by?: string | null }[]): number | null {
  const booked = cases.filter((c) => c.booked_by)
  if (booked.length === 0) return null
  return booked.filter((c) => c.booked_by === 'patient').length / booked.length
}

/**
 * Median minutes from arrival to the start of consultation.
 * This is the pilot's primary outcome measure.
 */
function medianWait(
  cases: { actual_arrival_time?: string | null; consultation_start_time?: string | null }[]
): number | null {
  const waits = cases
    .filter((c) => c.actual_arrival_time && c.consultation_start_time)
    .map(
      (c) =>
        (new Date(c.consultation_start_time!).getTime() -
          new Date(c.actual_arrival_time!).getTime()) /
        60000
    )
    .filter((m) => m >= 0)
    .sort((a, b) => a - b)

  if (waits.length === 0) return null
  const mid = Math.floor(waits.length / 2)
  return waits.length % 2 === 0
    ? Math.round((waits[mid - 1] + waits[mid]) / 2)
    : Math.round(waits[mid])
}

function getLast14Days(cases: { created_at: string }[]) {
  const days: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days[d.toISOString().slice(0, 10)] = 0
  }
  for (const c of cases) {
    const day = c.created_at.slice(0, 10)
    if (day in days) days[day]++
  }
  return Object.entries(days).map(([date, count]) => ({ date, count }))
}

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
    (supabase.from('triage_cases') as any).select('id, urgency, status, created_at'),
    (supabase.from('profiles') as any).select('id, role, verification_status, created_at'),
    (supabase.from('case_messages') as any).select('id, created_at'),
  ])

  const cases = casesRes.data || []
  const profiles = profilesRes.data || []

  const stats = {
    totalCases: cases.length,
    openCases: cases.filter((c: any) => c.status === 'open').length,
    closedCases: cases.filter((c: any) => c.status === 'closed').length,
    emergency: cases.filter((c: any) => c.urgency === 'emergency').length,
    urgent: cases.filter((c: any) => c.urgency === 'urgent').length,
    routine: cases.filter((c: any) => c.urgency === 'routine').length,
    totalPatients: profiles.filter((p: any) => p.role === 'patient').length,
    totalClinicians: profiles.filter((p: any) => p.role === 'clinician').length,
    pendingClinicians: profiles.filter((p: any) => p.role === 'clinician' && p.verification_status === 'pending').length,
    totalMessages: messagesRes.data?.length || 0,
    recentActivity: getLast14Days(cases),
  }

  return NextResponse.json({ stats })
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

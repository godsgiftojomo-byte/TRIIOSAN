import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/supabase/types'

export async function requireProfile(requiredRole?: UserRole): Promise<{
  userId: string
  profile: Profile
}> {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    redirect('/login')
  }

  const { data: profileRaw, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  const profile = profileRaw as Profile | null

  if (profileError || !profile) {
    redirect('/signup')
  }

  if (requiredRole && profile.role !== requiredRole) {
    redirect(profile.role === 'clinician' ? '/clinician' : '/dashboard')
  }

  return { userId: authData.user.id, profile }
}

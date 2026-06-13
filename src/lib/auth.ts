import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/supabase/types'

/**
 * Fetches the current authenticated user's profile.
 * Redirects to /login if not authenticated.
 * If `requiredRole` is provided and the profile's role doesn't match,
 * redirects to that role's home instead.
 */
export async function requireProfile(requiredRole?: UserRole): Promise<{
  userId: string
  profile: Profile
}> {
  const supabase = createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    // Authenticated but no profile row — shouldn't normally happen,
    // send back to signup to complete profile creation.
    redirect('/signup')
  }

  if (requiredRole && profile.role !== requiredRole) {
    redirect(profile.role === 'clinician' ? '/clinician' : '/dashboard')
  }

  return { userId: authData.user.id, profile: profile as Profile }
}

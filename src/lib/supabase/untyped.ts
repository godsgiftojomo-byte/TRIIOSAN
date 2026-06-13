import { createClient as createTypedServerClient } from './server'

// Returns the same Supabase client but without the Database generic,
// which avoids the never-type inference bug in @supabase/ssr@0.5.x.
// Use this only for queries where TypeScript collapses the type to never.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createUntypedClient() {
  return createTypedServerClient() as any
}

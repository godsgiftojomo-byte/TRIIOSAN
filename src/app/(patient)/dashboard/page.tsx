import Link from 'next/link'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { t } from '@/lib/i18n/translations'
import { SymptomChecker } from './SymptomChecker'
import type { TriageCase } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const { userId, profile } = await requireProfile('patient')
  const supabase = createClient()
  const lang = profile.preferred_language

  // If the patient already has an open case, surface it so they don't
  // lose track of an ongoing conversation with a clinician. This does
  // NOT block starting a new check-in — per spec, a new concern always
  // starts a fresh case, with past cases kept for reference.
  const { data: openCases } = await supabase
    .from('triage_cases')
    .select('*')
    .eq('patient_id', userId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)

  const openCase = (openCases?.[0] as TriageCase | undefined) || null

  return (
    <div className="min-h-screen">
      <AppNav role="patient" fullName={profile.full_name} />
      <main className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-4">
          {openCase && (
            <Link
              href={`/case/${openCase.id}`}
              className="card flex items-center gap-3 border-ember/20 bg-ember-50 transition-colors hover:border-ember/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                <MessageCircle className="h-5 w-5 text-ember" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  {t(lang, 'dashboard.openCaseBanner')}
                </p>
                <p className="mt-0.5 truncate text-sm text-ink/60">{openCase.primary_complaint}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ember" />
            </Link>
          )}

          <SymptomChecker preferredLanguage={profile.preferred_language} />
        </div>
      </main>
    </div>
  )
}

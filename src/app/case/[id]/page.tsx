import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { CaseSummary } from '@/components/CaseSummary'
import { MessageThread } from '@/components/MessageThread'
import { AppointmentForm } from '@/components/AppointmentForm'
import { t } from '@/lib/i18n/translations'
import type { CaseMessage, TriageCase } from '@/lib/supabase/types'

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const { userId, profile } = await requireProfile()
  const supabase = createClient()

  const { data: triageCaseRaw, error: caseError } = await supabase
    .from('triage_cases')
    .select('*')
    .eq('id', params.id)
    .single()

  const triageCase = triageCaseRaw as TriageCase | null

  if (caseError || !triageCase) {
    redirect(profile.role === 'clinician' ? '/clinician' : '/dashboard')
  }

  const typedCase = triageCase as TriageCase

  if (profile.role === 'patient' && typedCase.patient_id !== userId) {
    redirect('/dashboard')
  }

  const { data: messagesRaw } = await supabase
    .from('case_messages')
    .select('*')
    .eq('case_id', params.id)
    .order('created_at', { ascending: true })

  const messages = (messagesRaw || []) as CaseMessage[]

  const isClinician = profile.role === 'clinician'
  const isVerifiedClinician = isClinician && profile.verification_status === 'verified'
  const isOpen = typedCase.status === 'open'

  let patientName: string | undefined
  if (isClinician) {
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', typedCase.patient_id)
      .single()
    patientName = (patientProfile as { full_name: string } | null)?.full_name
  }

  return (
    <div className="min-h-screen">
      <AppNav role={profile.role} fullName={profile.full_name} />

      <main className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-4">
          <Link
            href={isClinician ? '/clinician' : '/history'}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(profile.preferred_language, 'common.back')}
          </Link>

          <CaseSummary triageCase={typedCase} patientName={patientName} />

          <MessageThread
            caseId={typedCase.id}
            currentUserId={userId}
            currentUserRole={profile.role}
            initialMessages={messages}
            disabled={!isOpen}
          />

          {isClinician && isOpen && isVerifiedClinician && (
            <AppointmentForm caseId={typedCase.id} />
          )}
        </div>
      </main>
    </div>
  )
}

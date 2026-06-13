import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, TRIAGE_MODEL } from '@/lib/anthropic/client'
import { buildAssessmentPrompt, parseModelJson } from '@/lib/anthropic/prompts'
import { checkRedFlags, applyRedFlagOverride } from '@/lib/triage/redFlags'
import type { ChecklistItem, Language, Urgency } from '@/lib/supabase/types'

interface AssessmentResponse {
  urgency: Urgency
  assessment: string
  recommended_tests: string[]
}

const VALID_URGENCY: Urgency[] = ['emergency', 'urgent', 'routine']

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const complaint: string = (body?.complaint || '').trim()
  const checklist: ChecklistItem[] = Array.isArray(body?.checklist) ? body.checklist : []
  const language: Language = body?.language || 'en'

  if (!complaint) {
    return NextResponse.json({ error: 'complaint is required' }, { status: 400 })
  }

  // --- Run the red-flag rule check on ALL patient-provided text ---
  const combinedText = [complaint, ...checklist.map((c) => c.answer || '')].join(' ')
  const redFlags = checkRedFlags(combinedText)

  // --- Get the LLM's classification ---
  let aiResult: AssessmentResponse | null = null

  try {
    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: TRIAGE_MODEL,
      max_tokens: 1000,
      messages: [
        { role: 'user', content: buildAssessmentPrompt(complaint, checklist, language) },
      ],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from model')
    }

    const parsed = parseModelJson<AssessmentResponse>(textBlock.text)

    if (!VALID_URGENCY.includes(parsed.urgency)) {
      throw new Error(`Invalid urgency from model: ${parsed.urgency}`)
    }

    aiResult = {
      urgency: parsed.urgency,
      assessment: parsed.assessment || '',
      recommended_tests: Array.isArray(parsed.recommended_tests)
        ? parsed.recommended_tests.slice(0, 4)
        : [],
    }
  } catch (err) {
    console.error('triage assessment error:', err)
    // If the AI call fails entirely, fall back to a conservative default.
    // If red flags were found, this still gets escalated below.
    aiResult = {
      urgency: 'routine',
      assessment: FALLBACK_ASSESSMENT[language] || FALLBACK_ASSESSMENT.en,
      recommended_tests: [],
    }
  }

  // --- Apply rule-based override (can only escalate) ---
  const { urgency, source } = applyRedFlagOverride(aiResult.urgency, redFlags)

  // --- Save the case ---
  const { data: caseRow, error: insertError } = await supabase
    .from('triage_cases')
    .insert({
      patient_id: authData.user.id,
      primary_complaint: complaint,
      complaint_language: language,
      checklist,
      ai_assessment: aiResult.assessment,
      urgency,
      urgency_source: source,
      recommended_tests: aiResult.recommended_tests,
      status: 'open',
    })
    .select()
    .single()

  if (insertError || !caseRow) {
    console.error('case insert error:', insertError)
    return NextResponse.json({ error: 'Failed to save case' }, { status: 500 })
  }

  return NextResponse.json({
    case: caseRow,
    urgency,
    urgencySource: source,
    assessment: aiResult.assessment,
    recommendedTests: aiResult.recommended_tests,
  })
}

const FALLBACK_ASSESSMENT: Record<Language, string> = {
  en: "We've recorded what you've shared. A clinician will review your case shortly — you can continue the conversation below.",
  yo: 'A ti gba ohun tí o sọ. Dókítà yóò wo ọ̀rọ̀ rẹ láìpẹ́ — o lè tẹ̀síwájú ìfọ̀rọ̀wérọ̀ ní ìsàlẹ̀.',
  ha: 'Mun rubuta abin da ka faɗa. Likita zai duba lamarinku ba da daɗewa — za ka iya cigaba da tattaunawa a ƙasa.',
  ig: 'Anyị edebanyela ihe ị kọwara. Dọkịta ga-elele okwu gị n’oge na-adịghị anya — ị nwere ike ịga n’ihu na mkparịta ụka n’okpuru.',
  pcm: 'We don record wetin you talk. Clinician go review your case soon — you fit continue the gist for down.',
}

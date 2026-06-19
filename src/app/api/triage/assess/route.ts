import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithGemini } from '@/lib/anthropic/client'
import { buildAssessmentPrompt, parseModelJson } from '@/lib/anthropic/prompts'
import { checkRedFlags } from '@/lib/triage/redFlags'
import { evaluateProtocols } from '@/lib/triage/protocols'
import type { Language, Urgency, ChecklistItem } from '@/lib/supabase/types'

interface AssessmentBody {
  complaint: string
  allAnswers: ChecklistItem[]
  language: Language
}

interface ModelAssessment {
  urgency: Urgency
  assessment: string
  assessment_detail: string
  clinician_summary: string   // clinician-only — saved to DB, never sent to patient UI
  recommended_tests: string[]
  immediate_action: string
}

const URGENCY_RANK: Record<Urgency, number> = { emergency: 2, urgent: 1, routine: 0 }

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: AssessmentBody = await request.json()
  const { complaint, allAnswers = [], language = 'en' } = body

  if (!complaint?.trim()) {
    return NextResponse.json({ error: 'complaint is required' }, { status: 400 })
  }

  // Full symptom text for rule-based layers
  const fullText = [
    complaint,
    ...allAnswers.map((qa) => `${qa.question} ${qa.answer}`),
  ].join(' ')

  // Rule-based layers always run — independent of AI
  const redFlagUrgency = checkRedFlags(fullText)
  const matchedProtocol = evaluateProtocols(fullText)
  const protocolUrgency = matchedProtocol?.urgency ?? null

  // AI assessment via Gemini
  let aiResult: ModelAssessment | null = null
  let aiError: string | null = null

  try {
    const prompt = buildAssessmentPrompt(complaint, allAnswers, language)
    // NEW SDK: generateWithGemini() — replaces old getGeminiModel().generateContent()
    const text = await generateWithGemini(prompt)

    if (!text) throw new Error('Empty response from Gemini')

    const parsed = parseModelJson<ModelAssessment>(text)

    if (!parsed.urgency || !['emergency', 'urgent', 'routine'].includes(parsed.urgency)) {
      throw new Error(`Invalid urgency value from model: ${parsed.urgency}`)
    }
    if (!parsed.assessment) {
      throw new Error('Model response missing assessment field')
    }

    aiResult = parsed
  } catch (err: unknown) {
    aiError = err instanceof Error ? err.message : String(err)
    console.error('[triage/assess] Gemini error:', aiError)
  }

  // Determine final urgency — escalate-only
  let finalUrgency: Urgency = aiResult?.urgency ?? 'urgent'
  let urgencySource: 'ai' | 'red-flag' | 'protocol' | 'fallback' =
    aiResult ? 'ai' : 'fallback'

  if (redFlagUrgency && URGENCY_RANK[redFlagUrgency] > URGENCY_RANK[finalUrgency]) {
    finalUrgency = redFlagUrgency
    urgencySource = 'red-flag'
  }
  if (protocolUrgency && URGENCY_RANK[protocolUrgency] > URGENCY_RANK[finalUrgency]) {
    finalUrgency = protocolUrgency
    urgencySource = 'protocol'
  }

  const assessment = aiResult?.assessment ?? FALLBACK_ASSESSMENT[language] ?? FALLBACK_ASSESSMENT.en
  const assessmentDetail = aiResult?.assessment_detail ?? FALLBACK_DETAIL[language] ?? FALLBACK_DETAIL.en
  // AI-generated action is complaint-specific — always prefer it over protocol hardcoded string
  const immediateAction = aiResult?.immediate_action ?? matchedProtocol?.immediateAction ?? FALLBACK_ACTION[language] ?? FALLBACK_ACTION.en

  // Tests: AI-only tests shown to patient (relevant, complaint-specific).
  // Protocol tests + combined list saved internally for clinician review.
  const aiTests = aiResult?.recommended_tests ?? []
  const protocolTests = matchedProtocol?.recommendedTests ?? []
  const allTestsForClinician = [...new Set([...protocolTests, ...aiTests])]

  // Save to Supabase — store full data including protocol name for clinician
  const { data: savedCase, error: saveError } = await supabase
    .from('triage_cases')
    .insert({
      patient_id: authData.user.id,
      primary_complaint: complaint,
      complaint_language: language,
      checklist_qa: allAnswers,
      urgency: finalUrgency,
      urgency_source: urgencySource,
      ai_assessment: assessment,
      ai_assessment_detail: assessmentDetail,
      ai_clinician_summary: aiResult?.clinician_summary ?? null,  // clinician-only
      recommended_tests: allTestsForClinician,
      immediate_action: immediateAction,
      matched_protocol_id: matchedProtocol?.id ?? null,
      status: 'open',
    })
    .select()
    .single()

  if (saveError || !savedCase) {
    console.error('[triage/assess] Supabase save error:', JSON.stringify(saveError))
    return NextResponse.json(
      { error: 'Failed to save triage case. Please try again.', detail: saveError?.message },
      { status: 500 }
    )
  }

  // Patient-facing response — NO diagnosis name, NO protocol-derived test list.
  // The clinician sees everything via the case record in Supabase.
  return NextResponse.json({
    caseId: savedCase.id,
    urgency: finalUrgency,
    urgencySource,
    assessment,
    assessmentDetail,
    // Only show AI-generated tests to patient, not the protocol's full list
    recommendedTests: aiTests.slice(0, 4),
    immediateAction,
    // protocolName intentionally omitted — clinician-only
    // clinicianNotes intentionally omitted — clinician-only
    aiUnavailable: !!aiError,
    aiError: process.env.NODE_ENV === 'development' ? aiError : undefined,
  })
}

const FALLBACK_ASSESSMENT: Record<Language, string> = {
  en: "We've reviewed the symptoms you described and recorded your case. A clinician will review your information and respond to you shortly.",
  yo: "A ti ṣàgbéyẹ̀wò àwọn àmì àìsàn tí o ṣàpèjúwe àti ìgbàsilẹ̀ ọ̀ràn rẹ. Dókítà kan yóò ṣàgbéyẹ̀wò àlàyé rẹ tí yóò sì dáhùn sí rẹ láìpẹ́.",
  ha: "Mun duba alamomin da kuka bayyana kuma mun rubuta kayanku. Likita zai duba bayananku kuma ya amsa muku nan ba da jimawa ba.",
  ig: "Anyị lelee ihe ọ bụla i kọwaara anyị ma dere okwu gị. Dọkịta ga-elele ozi gị ma zaghachi gị n'oge na-adịghị anya.",
  pcm: "We don check the symptoms wey you describe and we don record your case. One dokita go look your information and reply you soon.",
}

const FALLBACK_DETAIL: Record<Language, string> = {
  en: "Your case has been flagged for clinician review. The urgency level shown reflects your symptoms and our clinical guidelines. Please respond to any messages from your assigned clinician as soon as you can.",
  yo: "A ti fi àmì sí ọ̀ràn rẹ fún ìgbéyẹ̀wò dókítà. Ìwọ̀n pàtàkì tí a fihàn ṣàfihàn àmì àìsàn rẹ àti àwọn ìlànà ìtọ́jú wa.",
  ha: "An yiwa kayanku alamar don duba daga likita. Matakan gaggawa da aka nuna yana nuna alamominka da kuma jagororin asibiti namu.",
  ig: "Anyị akara okwu gị maka nlele dọkịta. Ọkwa nsogbu egosiri ọzọ gosipụta ihe ọ bụla i dere na ụkpụrụ ọgwụ anyị.",
  pcm: "We don flag your case for dokita to check. The urgency level wey show dey reflect your symptoms and our medical guidelines.",
}

const FALLBACK_ACTION: Record<Language, string> = {
  en: "Rest and stay hydrated while you wait for a clinician to respond. If your symptoms worsen significantly, go to the nearest hospital immediately.",
  yo: "Sinmi kí o sì mu omi tó to nígbà tí o ń dúró fún dókítà. Bí àwọn àmì àìsàn rẹ bá burú sí i lọ́pọ̀lọpọ̀, lọ sí ilé-ìwòsàn tó wà nítòsí.",
  ha: "Huta kuma sha ruwa yayin da kake jiran likita ya amsa. Idan alamominka sun yi muni sosai, je asibiti mafi kusa nan da nan.",
  ig: "Zuo ike ma mee ka mmiri dị n'ahụ gị ka dọkịta na-azaghachi. Ọ bụrụ na ihe ọ bụla dị gị njọ karịa, gaa ụlọ ọgwụ dị nso ozugbo.",
  pcm: "Rest and drink water while you dey wait for dokita to reply. If your symptoms dey get worse bad bad, go the nearest hospital immediately.",
}

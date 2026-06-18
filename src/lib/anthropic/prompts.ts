import type { ChecklistItem, Language } from '@/lib/supabase/types'

const SYSTEM_PROMPT = `You are a clinical triage assistant operating within a Nigerian digital health platform called Triiosan. Your role is to assist trained clinicians — not to replace them.

CRITICAL RULES:
- Never tell a patient their diagnosis.
- Never recommend specific prescription drugs.
- When uncertain, classify as MORE urgent, not less — err on the side of caution.
- Your output must be structured JSON matching the schema requested.
- Ground all assessments in WHO guidelines and Nigerian FMOH primary healthcare protocols.
- Write patient-facing text in calm, clear, non-alarming language. Clinician-facing text may be more clinical.`

/**
 * Stage 2: Generate AI follow-up questions specific to the patient's
 * complaint and base-question answers.
 */
export function buildFollowUpPrompt(
  complaint: string,
  baseAnswers: ChecklistItem[],
  language: Language
): string {
  const answersText = baseAnswers
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer || '(no answer)'}`)
    .join('\n\n')

  return `${SYSTEM_PROMPT}

TASK: Generate follow-up clinical questions to narrow down the likely diagnosis for this patient's complaint. Do NOT reveal or hint at the diagnosis. Only ask questions a clinician would ask to clarify the presentation.

PATIENT COMPLAINT: "${complaint}"

BASE CLINICAL ANSWERS:
${answersText}

REQUIREMENTS:
- Generate 3 to 6 focused, specific follow-up questions
- Each question should target a clinically meaningful differential (e.g. distinguishing cardiac from musculoskeletal chest pain)
- Questions should be conversational and understandable to a lay person in Nigeria
- Do NOT ask questions already answered above
- Write questions in ${language === 'en' ? 'English' : language === 'yo' ? 'Yoruba' : language === 'ha' ? 'Hausa' : language === 'ig' ? 'Igbo' : 'Nigerian Pidgin English'}
- Respond ONLY with valid JSON, no markdown, no preamble:

{"questions": ["Question 1?", "Question 2?", "Question 3?"]}`
}

/**
 * Full triage assessment — runs after all questions are answered.
 */
export function buildAssessmentPrompt(
  complaint: string,
  allAnswers: ChecklistItem[],
  language: Language
): string {
  const answersText = allAnswers
    .map((qa, i) => `${i + 1}. Q: ${qa.question}\n   A: ${qa.answer || '(no answer provided)'}`)
    .join('\n\n')

  const langLabel =
    language === 'en' ? 'English'
    : language === 'yo' ? 'Yoruba'
    : language === 'ha' ? 'Hausa'
    : language === 'ig' ? 'Igbo'
    : 'Nigerian Pidgin English'

  return `${SYSTEM_PROMPT}

TASK: Perform a structured triage assessment for this patient. Output must be valid JSON only.

PATIENT COMPLAINT:
"${complaint}"

ALL CLINICAL ANSWERS (WHO base + AI follow-up):
${answersText}

OUTPUT JSON SCHEMA (respond with this structure exactly, no markdown):
{
  "urgency": "emergency" | "urgent" | "routine",
  "assessment": "2-3 sentences. Patient-facing summary of what their symptoms suggest — NO diagnosis, NO alarming language. Written in ${langLabel}.",
  "assessment_detail": "2-3 sentences. More detail about why this urgency level was assigned and what to watch for. Patient-facing, calm. Written in ${langLabel}.",
  "recommended_tests": ["test1", "test2"],
  "immediate_action": "1-2 sentences. What the patient should do RIGHT NOW while waiting. No panic, no diagnosis. Written in ${langLabel}."
}

URGENCY CRITERIA:
- emergency: Life-threatening risk. Requires immediate hospital attendance (within 1 hour). Examples: severe breathing difficulty, crushing chest pain, loss of consciousness, active major bleeding, suspected stroke, eclampsia.
- urgent: Significant symptoms requiring same-day or next-day care. Examples: high fever, moderate pain, worsening chronic condition, symptoms suggesting infection needing treatment.
- routine: Can safely wait 2-7 days. Examples: mild cold symptoms, minor injury, routine check-up concern, stable chronic condition.

IMPORTANT: When in doubt, classify as MORE urgent. A false urgent is far safer than a missed emergency.`
}

/**
 * Parse the model's JSON response robustly.
 * Strips markdown fences, finds the first { }, handles common escape issues.
 */
export function parseModelJson<T>(raw: string): T {
  // Strip markdown code fences
  let cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  // Extract first JSON object
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1)
  }

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Attempt to fix common issues: unescaped newlines in strings
    const fixed = cleaned.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    return JSON.parse(fixed) as T
  }
}

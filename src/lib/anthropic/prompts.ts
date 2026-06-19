/**
 * Prompts for Triiosan's Gemini-powered triage AI.
 *
 * Design principles:
 * 1. Follow-up questions are genuinely complaint-specific — not generic fallbacks.
 * 2. Assessment output is split into patient-facing (reassuring, non-diagnostic)
 *    and clinician-facing (clinical reasoning, differential).
 * 3. The patient NEVER sees a diagnosis name — only urgency + action guidance.
 *    The clinician sees the full differential and reasoning in the case record.
 */

import type { ChecklistItem, Language } from '@/lib/supabase/types'

// ── Utility ────────────────────────────────────────────────────────────────

/**
 * Safely parses JSON from a model response, stripping markdown fences if present.
 */
export function parseModelJson<T>(text: string): T {
  // Strip ```json ... ``` or ``` ... ``` fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  return JSON.parse(cleaned) as T
}

// ── Stage 2: AI Follow-up Questions ────────────────────────────────────────

/**
 * Builds the prompt for generating complaint-specific follow-up questions.
 *
 * The key requirement: questions must be directly derived from the specific
 * complaint text and base answers — not a generic list that would be the same
 * for every patient.
 */
export function buildFollowUpPrompt(
  complaint: string,
  baseAnswers: ChecklistItem[],
  language: Language
): string {
  const baseAnswerSummary = baseAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer || '(no answer)'}`)
    .join('\n\n')

  const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en

  return `You are a clinical triage assistant helping gather symptom information in Nigeria.

A patient has described their complaint and answered some initial screening questions.
Your job is to generate 4–6 targeted follow-up questions that are SPECIFIC to THIS patient's complaint.

PATIENT COMPLAINT:
"${complaint}"

INITIAL SCREENING ANSWERS:
${baseAnswerSummary || '(none yet)'}

RULES:
- Questions must be directly relevant to the specific complaint above.
- Do NOT ask generic questions already covered (duration, severity, progression, medications, past history).
- Ask about: specific location/radiation, character of symptoms, associated symptoms relevant to this complaint, aggravating/relieving factors, relevant system-specific symptoms.
- Keep each question short and clear — these will be shown on a mobile phone.
- ${languageInstruction}

Respond ONLY with a JSON object in this exact format (no preamble, no markdown fences):
{"questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]}`
}

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  en: 'Write questions in English.',
  yo: 'Write questions in Yoruba.',
  ha: 'Write questions in Hausa.',
  ig: 'Write questions in Igbo.',
  pcm: 'Write questions in Nigerian Pidgin English.',
}

// ── Assessment Prompt ───────────────────────────────────────────────────────

/**
 * Builds the prompt for the final triage assessment.
 *
 * IMPORTANT SPLIT:
 * - `assessment` (patient-facing): Reassuring, no diagnosis name, no medical jargon.
 *   Explains what will happen next. Does NOT say "you have X".
 * - `assessment_detail` (patient-facing): Brief guidance on what to monitor.
 * - `clinician_summary` (clinician-only, saved to DB but NOT sent to patient UI):
 *   Full clinical reasoning, differential diagnosis, red flags.
 * - `recommended_tests`: 2–4 tests directly relevant to the complaint.
 *   Must be specific to THIS complaint, not a generic panel.
 * - `immediate_action`: Plain-language guidance on what to do right now.
 * - `urgency`: "emergency" | "urgent" | "routine"
 */
export function buildAssessmentPrompt(
  complaint: string,
  allAnswers: ChecklistItem[],
  language: Language
): string {
  const answerSummary = allAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer || '(skipped)'}`)
    .join('\n\n')

  const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en

  return `You are a clinical triage AI for Triiosan, a Nigerian digital health platform.
A patient has described their complaint and answered screening questions.
Your job is to assess urgency and provide structured triage output.

PATIENT COMPLAINT:
"${complaint}"

SCREENING ANSWERS:
${answerSummary || '(none)'}

OUTPUT RULES:
1. "urgency": Must be exactly one of: "emergency", "urgent", "routine"
   - emergency: life-threatening, requires immediate hospital attendance
   - urgent: needs clinician review today or tomorrow
   - routine: can wait for next available appointment

2. "assessment" (PATIENT-FACING — shown on screen):
   - 1–2 sentences. Reassuring but honest.
   - Do NOT state a diagnosis or use a medical condition name.
   - Do NOT say "you have [disease]" or "this is [disease]".
   - Acknowledge their symptoms and that their case is being reviewed.
   - Example good: "We've reviewed your symptoms and your case has been sent to a clinician for review."
   - Example bad: "You likely have a urinary tract infection." ← NEVER do this.
   - ${languageInstruction}

3. "assessment_detail" (PATIENT-FACING):
   - 1–2 sentences of additional context about what to expect or watch for.
   - Still no diagnosis name. Focus on what the patient should do or monitor.
   - ${languageInstruction}

4. "clinician_summary" (CLINICIAN-ONLY — saved to database, not shown to patient):
   - Full clinical reasoning in English.
   - Include: most likely diagnosis, differential diagnoses, red flags identified, reasoning.
   - Be specific and clinical. This is what the reviewing doctor reads.
   - Always in English regardless of patient language.

5. "recommended_tests": Array of 2–4 investigation names.
   - MUST be directly relevant to this specific complaint.
   - Do not include tests that have no connection to the described symptoms.
   - Use Nigerian/WHO standard test names (e.g. "FBC", "Urinalysis (dipstick)", "Fasting blood glucose").
   - Fewer is better — only what would genuinely guide management.

6. "immediate_action" (PATIENT-FACING):
   - 2–3 sentences of plain-language advice on what to do right now.
   - Practical, Nigerian context (e.g. mention PHC, NHIA, nearest hospital).
   - ${languageInstruction}

Respond ONLY with a JSON object (no markdown fences, no preamble):
{
  "urgency": "urgent",
  "assessment": "...",
  "assessment_detail": "...",
  "clinician_summary": "...",
  "recommended_tests": ["Test 1", "Test 2"],
  "immediate_action": "..."
}`
}

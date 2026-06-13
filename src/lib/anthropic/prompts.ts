import type { Language } from '@/lib/supabase/types'

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  yo: 'Yoruba',
  ha: 'Hausa',
  ig: 'Igbo',
  pcm: 'Nigerian Pidgin',
}

/**
 * Step A: given a patient's free-text primary complaint, generate a short
 * list of follow-up checklist questions to help narrow down a diagnosis.
 *
 * The model should respond ONLY with JSON matching:
 *   { "questions": string[] }
 */
export function buildChecklistPrompt(complaint: string, language: Language): string {
  const langName = LANGUAGE_NAMES[language] || 'English'

  return `You are a clinical intake assistant for Triiosan, a digital health triage tool used in Nigeria. A patient has described their primary health concern. Your job is to generate 4-6 short follow-up questions that a nurse or doctor would typically ask to narrow down what might be going on, BEFORE the patient sees a clinician.

PATIENT'S COMPLAINT (may be in English, Yoruba, Hausa, Igbo, or Nigerian Pidgin):
"""
${complaint}
"""

Guidelines:
- Write the questions in ${langName}, matching the language/style the patient used, so they feel natural to answer.
- Questions should be simple, answerable in a sentence or two (this is NOT a yes/no checklist — patients will type short free-text answers).
- Focus on: duration/onset, severity, associated symptoms, relevant history (e.g. "have you taken any medication for this already?", "do you have any other conditions like diabetes or hypertension?", relevant for pregnancy if applicable, exposure history if relevant e.g. malaria-endemic context).
- Do NOT ask questions that are alarming or that imply a diagnosis.
- Do NOT include any question asking the patient to rate pain 1-10 (not commonly used in this context) — instead ask things like "how bad is the pain — mild, moderate, or severe?" if pain is relevant.
- Keep each question under 15 words.

Respond with ONLY a JSON object, no other text, no markdown code fences, in this exact shape:
{"questions": ["question 1", "question 2", ...]}`
}

/**
 * Step B: given the full case (complaint + checklist Q&A), produce a
 * structured triage assessment.
 *
 * The model should respond ONLY with JSON matching:
 *   {
 *     "urgency": "emergency" | "urgent" | "routine",
 *     "assessment": string,       // 2-4 sentence plain-language summary for the patient
 *     "recommended_tests": string[]  // e.g. ["Malaria RDT", "Full Blood Count"]
 *   }
 */
export function buildAssessmentPrompt(
  complaint: string,
  checklist: { question: string; answer: string }[],
  language: Language
): string {
  const langName = LANGUAGE_NAMES[language] || 'English'

  const checklistText = checklist
    .map((c) => `Q: ${c.question}\nA: ${c.answer || '(skipped)'}`)
    .join('\n\n')

  return `You are the triage assessment engine for Triiosan, a digital health triage and referral tool used in Nigeria. You are NOT a replacement for a doctor — your job is to give the patient a clear, honest first read on how urgent their situation is, and to flag useful tests, so that when they see a clinician (in-app or in person), things move faster.

PATIENT'S PRIMARY COMPLAINT:
"""
${complaint}
"""

FOLLOW-UP QUESTIONS AND ANSWERS:
${checklistText || '(none provided)'}

Your task:
1. Classify urgency as exactly one of: "emergency", "urgent", or "routine".
   - "emergency": Signs that could indicate a life-threatening condition requiring immediate hospital/ER attention (e.g. difficulty breathing, chest pain, heavy bleeding, unconsciousness, signs of stroke, severe dehydration in a child, pregnancy with bleeding, etc.)
   - "urgent": Should be seen by a clinician within about a day — not immediately life-threatening but could worsen or needs timely evaluation (e.g. high fever lasting several days, persistent vomiting, signs consistent with malaria/typhoid, infections that need antibiotics).
   - "routine": Manageable, mild, or chronic-stable presentations where a clinician's input is helpful but not time-critical (e.g. mild cold symptoms, minor aches, routine follow-up questions).
   - When uncertain between two levels, choose the MORE urgent one. It is much safer to over-triage than under-triage.

2. Write a 2-4 sentence assessment IN ${langName}, in plain language a patient can understand, that:
   - Briefly reflects back what they described (so they feel heard)
   - Explains in general terms what the urgency level means for them
   - Does NOT give a definitive diagnosis (e.g. say "this could be consistent with several things including malaria or a viral infection" rather than "you have malaria")
   - Encourages them to continue to the clinician conversation in the app

3. Suggest 0-4 relevant tests/investigations as "recommended_tests" — common, accessible tests in the Nigerian healthcare context where relevant (e.g. "Malaria RDT", "Full Blood Count (FBC)", "Urinalysis", "Widal Test", "Blood Pressure Check", "Random Blood Sugar", "Stool Microscopy"). Only suggest tests that plausibly relate to the symptoms. If nothing specific applies (e.g. for routine/mild cases), return an empty array.

Respond with ONLY a JSON object, no other text, no markdown code fences, in this exact shape:
{"urgency": "emergency" | "urgent" | "routine", "assessment": "...", "recommended_tests": ["...", "..."]}`
}

/**
 * Parses a JSON response from the model, tolerating common formatting
 * issues (markdown code fences, leading/trailing whitespace).
 */
export function parseModelJson<T>(raw: string): T {
  let cleaned = raw.trim()

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  }

  return JSON.parse(cleaned) as T
}

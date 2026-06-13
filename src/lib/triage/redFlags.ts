import type { Urgency } from '@/lib/supabase/types'

/**
 * Rule-based "red flag" layer for the hybrid triage engine.
 *
 * This is intentionally simple and keyword-based for the demo. It is
 * modeled loosely on WHO Emergency Triage Assessment and Treatment (ETAT)
 * danger signs, adapted to surface common red-flag presentations relevant
 * to the Nigerian context (e.g. malaria-related danger signs, common
 * obstetric emergencies).
 *
 * IMPORTANT: For anything beyond a pilot/demo, this keyword list should be
 * reviewed and substantially expanded by clinicians, ideally backed by a
 * proper structured triage protocol rather than keyword matching, and
 * should account for the multiple languages patients may write in.
 *
 * How it fits into the hybrid model:
 * - The LLM produces an initial urgency classification + assessment.
 * - This function independently scans the patient's raw text
 *   (complaint + checklist answers) for red-flag terms.
 * - If a red flag is found and the LLM's classification is LESS urgent
 *   than what the red flag implies, this function's result OVERRIDES
 *   the LLM's — the system always escalates, never de-escalates, based
 *   on rules. `urgency_source` is then recorded as 'rule_override'.
 */

interface RedFlagRule {
  urgency: Urgency
  // Lowercase substrings. Matching is intentionally loose (substring,
  // not word-boundary) to catch common misspellings/phrasing variants
  // across English/Pidgin. This trades some false positives for fewer
  // missed emergencies, which is the safer direction for a triage tool.
  terms: string[]
}

const RED_FLAG_RULES: RedFlagRule[] = [
  {
    urgency: 'emergency',
    terms: [
      // Breathing / airway
      'cannot breathe',
      "can't breathe",
      'difficulty breathing',
      'struggling to breathe',
      'gasping',
      'choking',
      'blue lips',
      'turning blue',
      // Cardiac / chest
      'chest pain',
      'crushing pain in my chest',
      'pain in my chest',
      // Neuro
      'unconscious',
      'unresponsive',
      'not waking up',
      'fainted',
      'fainting',
      'seizure',
      'convulsion',
      'convulsing',
      'fitting',
      'stroke',
      'one side of my body is weak',
      'face is drooping',
      'slurred speech',
      'severe headache and stiff neck',
      'stiff neck',
      // Bleeding / trauma
      'heavy bleeding',
      'bleeding heavily',
      'won\'t stop bleeding',
      'severe bleeding',
      'vomiting blood',
      'coughing blood',
      'blood in stool',
      'blood in vomit',
      'gunshot',
      'stabbed',
      'severe burns',
      'road traffic accident',
      'car accident',
      // Obstetric
      'pregnant and bleeding',
      'bleeding and pregnant',
      'severe abdominal pain and pregnant',
      'baby not moving',
      'water broke',
      // Severe pain / shock
      'worst pain of my life',
      'severe abdominal pain',
      'cold and clammy',
      'pale and sweating',
      // Pediatric danger signs (ETAT)
      'baby is not feeding',
      'baby is too weak to feed',
      'child is limp',
      'child is floppy',
      'lips are blue',
      // Poisoning / overdose
      'overdose',
      'swallowed poison',
      'drank something poisonous',
      // Suicidal ideation — escalate but framed for human follow-up,
      // not as a "medical emergency" alone. See note below.
      'want to kill myself',
      'thinking of suicide',
      'suicidal',
      'end my life',
    ],
  },
  {
    urgency: 'urgent',
    terms: [
      'high fever',
      'fever for more than',
      'fever that won\'t go down',
      'persistent vomiting',
      'cannot keep food down',
      'cannot keep water down',
      'severe diarrhea',
      'severe diarrhoea',
      'dehydrated',
      'dehydration',
      'yellow eyes',
      'jaundice',
      'severe weakness',
      'too weak to stand',
      'rash that is spreading',
      'swelling of the face',
      'swelling of face',
      'difficulty swallowing',
      'severe joint pain and fever',
      'stiff joints and fever',
      'productive cough for more than a week',
      'coughing for more than two weeks',
      'unexplained weight loss',
      'severe ear pain',
      'eye injury',
      'sudden loss of vision',
      'sudden vision loss',
    ],
  },
]

export interface RedFlagResult {
  matched: boolean
  urgency: Urgency | null
  matchedTerms: string[]
}

/**
 * Scans free text for red-flag terms. Returns the highest-severity
 * match found, if any.
 */
export function checkRedFlags(text: string): RedFlagResult {
  const lower = text.toLowerCase()
  const matchedTerms: string[] = []
  let highestUrgency: Urgency | null = null

  for (const rule of RED_FLAG_RULES) {
    for (const term of rule.terms) {
      if (lower.includes(term)) {
        matchedTerms.push(term)
        if (!highestUrgency || urgencyRank(rule.urgency) > urgencyRank(highestUrgency)) {
          highestUrgency = rule.urgency
        }
      }
    }
  }

  return {
    matched: matchedTerms.length > 0,
    urgency: highestUrgency,
    matchedTerms,
  }
}

/** Higher number = more urgent. */
function urgencyRank(u: Urgency): number {
  switch (u) {
    case 'emergency':
      return 2
    case 'urgent':
      return 1
    case 'routine':
      return 0
  }
}

/**
 * Combines the AI's classification with the rule-based red-flag check.
 * Rules can only escalate (never reduce) the AI's classification.
 */
export function applyRedFlagOverride(
  aiUrgency: Urgency,
  redFlags: RedFlagResult
): { urgency: Urgency; source: 'ai' | 'rule_override' } {
  if (redFlags.matched && redFlags.urgency && urgencyRank(redFlags.urgency) > urgencyRank(aiUrgency)) {
    return { urgency: redFlags.urgency, source: 'rule_override' }
  }
  return { urgency: aiUrgency, source: 'ai' }
}

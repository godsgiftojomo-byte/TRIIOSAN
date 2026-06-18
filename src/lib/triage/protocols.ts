/**
 * Clinical Protocols for Triiosan Triage Engine
 *
 * Sources:
 * - Nigerian Federal Ministry of Health (FMOH) Primary Health Care guidelines
 * - WHO Integrated Management of Childhood Illness (IMCI)
 * - WHO Emergency Triage Assessment and Treatment (ETAT)
 * - Nigeria Essential Medicine List (NEML) clinical protocols
 * - West African College of Physicians (WACP) clinical guidelines
 *
 * Design principles:
 * 1. Protocols trigger on COMBINATIONS of symptoms, not single symptoms.
 *    A fever alone does not trigger malaria protocol. Fever + headache +
 *    chills in an endemic context does.
 * 2. Escalate-only. A protocol can only raise urgency, never lower it.
 *    If the AI says emergency and a protocol says urgent, emergency wins.
 * 3. Calibrated sensitivity. Thresholds are set to catch genuine cases
 *    without routing every common complaint to a specialist protocol.
 * 4. Non-alarming language. Patient-facing text informs without causing panic.
 */

import type { Urgency } from '@/lib/supabase/types'

export interface Protocol {
  id: string
  name: string
  urgency: Urgency
  /** Min number of trigger terms that must match for this protocol to fire */
  minMatches: number
  /**
   * Symptom terms to match against the patient's full symptom text
   * (complaint + all checklist answers combined, lowercased).
   * Each inner array is an OR group — match any term within it.
   * All outer arrays must contribute at least one match (AND logic between groups).
   */
  triggerGroups: string[][]
  /** Patient-facing explanation of what this urgency level means for them */
  patientGuidance: string
  /** What the patient should do RIGHT NOW — calm, clear, not alarming */
  immediateAction: string
  /** Tests/investigations recommended */
  recommendedTests: string[]
  /** Full clinical reasoning shown only to the clinician */
  clinicianNotes: string
}

export const PROTOCOLS: Protocol[] = [
  // ── EMERGENCY PROTOCOLS ─────────────────────────────────────────────────

  {
    id: 'respiratory-distress',
    name: 'Respiratory Distress',
    urgency: 'emergency',
    minMatches: 2,
    triggerGroups: [
      ['breathing', 'breath', 'breathe', 'inhale', 'exhale', 'respiratory', 'chest', 'shortness'],
      ['difficulty', 'can\'t', 'cannot', 'hard', 'struggling', 'gasping', 'wheezing', 'tight', 'fast', 'rapid', 'no breath'],
    ],
    patientGuidance: 'Your symptoms suggest you may be having difficulty breathing. This needs immediate medical attention — please do not wait.',
    immediateAction: 'Go to the nearest emergency room or call for help immediately. Sit upright if possible, loosen any tight clothing around your chest, and try to stay calm. Do not eat or drink anything until seen by a doctor.',
    recommendedTests: ['Oxygen saturation (pulse oximetry)', 'Chest X-ray', 'Full Blood Count (FBC)', 'Peak flow if asthma suspected'],
    clinicianNotes: 'Possible presentations: acute asthma exacerbation, pneumonia, pulmonary oedema, pleural effusion, pneumothorax. Assess RR, O2 sat, accessory muscle use. Prioritise airway management.',
  },

  {
    id: 'chest-pain-cardiac',
    name: 'Chest Pain — Possible Cardiac',
    urgency: 'emergency',
    minMatches: 2,
    triggerGroups: [
      ['chest pain', 'chest tightness', 'chest pressure', 'chest heaviness', 'chest discomfort', 'pain in chest', 'pain in my chest'],
      ['arm', 'jaw', 'shoulder', 'sweat', 'sweating', 'nausea', 'vomit', 'dizziness', 'faint', 'left side', 'spreading', 'radiating', 'shortness of breath'],
    ],
    patientGuidance: 'Chest pain with these symptoms needs urgent medical evaluation today. Please seek care right away.',
    immediateAction: 'Sit or lie down in a comfortable position. Avoid physical exertion. Go to the emergency room as soon as possible — do not drive yourself. If you have aspirin available and are not allergic to it, you may chew one 300mg tablet while waiting for help.',
    recommendedTests: ['ECG (12-lead)', 'Troponin I/T', 'Full Blood Count', 'Blood pressure', 'Blood sugar'],
    clinicianNotes: 'Rule out ACS, NSTEMI, pericarditis, aortic dissection, PE. Note radiation pattern, onset (sudden vs gradual), relationship to exertion. Risk factors: HTN, DM, smoking, family history.',
  },

  {
    id: 'stroke-signs',
    name: 'Possible Stroke / CVA',
    urgency: 'emergency',
    minMatches: 2,
    triggerGroups: [
      ['face', 'arm', 'leg', 'speech', 'speak', 'talk', 'vision', 'weakness', 'numbness', 'paralysis', 'droop', 'slurred', 'confused', 'confusion'],
      ['sudden', 'one side', 'left side', 'right side', 'can\'t', 'cannot', 'lost', 'severe headache', 'worst headache'],
    ],
    patientGuidance: 'Some of your symptoms could indicate a serious condition affecting your brain. This needs immediate emergency care — every minute matters.',
    immediateAction: 'Call for emergency help or go to the nearest hospital emergency room immediately. Do not eat, drink, or take any medication. Note the exact time your symptoms started — the doctor will need this.',
    recommendedTests: ['CT scan (head)', 'Blood pressure', 'Blood glucose', 'Full Blood Count', 'ECG', 'Clotting profile'],
    clinicianNotes: 'Use FAST criteria (Face droop, Arm weakness, Speech difficulty, Time to call). If within thrombolytic window and CT confirms ischaemic stroke, consider referral for tPA. Rule out hypoglycaemia (easy to treat and mimics stroke). Hypertensive urgency may also present similarly.',
  },

  {
    id: 'obstetric-emergency',
    name: 'Obstetric Emergency',
    urgency: 'emergency',
    minMatches: 2,
    triggerGroups: [
      ['pregnant', 'pregnancy', 'gestation', 'weeks pregnant', 'trimester', 'baby', 'fetus', 'labour', 'labor', 'contractions'],
      ['bleeding', 'blood', 'heavy bleeding', 'severe pain', 'abdomen', 'headache', 'vision', 'swelling', 'fitting', 'convulsion', 'not moving', 'movement stopped', 'no movement'],
    ],
    patientGuidance: 'During pregnancy, these symptoms need immediate medical attention. Please go to a hospital with maternity services right away.',
    immediateAction: 'Go to the nearest hospital with a maternity ward immediately. If you are bleeding heavily, lie on your left side. Call someone to take you — do not go alone. Bring your antenatal card/booklet if you have it.',
    recommendedTests: ['Blood pressure', 'Urine protein (dipstick)', 'FBC', 'Clotting profile', 'Ultrasound', 'CTG (if viable gestation)'],
    clinicianNotes: 'Consider: antepartum haemorrhage (placenta praevia/abruption), pre-eclampsia/eclampsia (BP + proteinuria + headache/vision changes), preterm labour, ectopic if <12 weeks. Check Rh status.',
  },

  {
    id: 'severe-dehydration',
    name: 'Severe Dehydration / Cholera-like Illness',
    urgency: 'emergency',
    minMatches: 3,
    triggerGroups: [
      ['diarrhoea', 'diarrhea', 'vomiting', 'stooling', 'purging', 'watery stool'],
      ['many times', 'multiple times', 'repeatedly', 'non-stop', 'hours', 'more than 5', 'more than 6', 'can\'t keep', 'everything comes out'],
      ['weak', 'weakness', 'dizzy', 'dizziness', 'can\'t stand', 'cannot stand', 'sunken', 'dry mouth', 'no urine', 'little urine', 'child', 'baby', 'infant'],
    ],
    patientGuidance: 'Repeated vomiting and diarrhoea, especially with weakness, can lead to dangerous dehydration quickly. You need medical attention today.',
    immediateAction: 'Start drinking ORS (oral rehydration solution) — you can make it at home with 1 litre clean water, 6 teaspoons sugar, and half teaspoon salt. Sip slowly even if you feel nauseous. Go to the hospital if vomiting prevents drinking, or if a child is becoming very weak or drowsy.',
    recommendedTests: ['Electrolytes (Na, K, Cl, HCO3)', 'Urea and Creatinine', 'Blood glucose', 'Stool microscopy & culture', 'Full Blood Count'],
    clinicianNotes: 'Assess hydration status: skin turgor, mucous membranes, capillary refill, BP, HR. In children: use WHO IMCI dehydration classification (A/B/C). Consider cholera if rice-water stools, IV access and fluids if severe. Notify DSNO if cholera suspected.',
  },

  {
    id: 'meningitis-signs',
    name: 'Possible Meningitis',
    urgency: 'emergency',
    minMatches: 3,
    triggerGroups: [
      ['severe headache', 'worst headache', 'terrible headache', 'very bad headache'],
      ['stiff neck', 'neck stiffness', 'neck pain', 'can\'t bend neck', 'neck is stiff'],
      ['fever', 'high temperature', 'hot body', 'temperature'],
      ['light', 'light hurts', 'photophobia', 'sensitive to light', 'noise', 'rash', 'vomiting', 'confusion', 'drowsy'],
    ],
    patientGuidance: 'A combination of severe headache, stiff neck, and fever needs immediate emergency care. Please go to hospital right away.',
    immediateAction: 'Go to the emergency room immediately. Keep the patient calm and in a quiet, dimly lit space while waiting. Do not give painkillers that might mask symptoms. Time is very important with this type of illness.',
    recommendedTests: ['Lumbar puncture (LP) + CSF analysis', 'Blood cultures (before antibiotics if possible)', 'Full Blood Count', 'CRP/ESR', 'CT head (before LP if signs of raised ICP)'],
    clinicianNotes: 'Classical triad: headache + neck stiffness + fever. Check Kernig\'s and Brudzinski\'s signs. Non-blanching petechial/purpuric rash = meningococcal septicaemia — give IV benzylpenicillin immediately. Do not delay antibiotics for imaging in critically ill patients.',
  },

  // ── URGENT PROTOCOLS ────────────────────────────────────────────────────

  {
    id: 'malaria-suspected',
    name: 'Suspected Malaria',
    urgency: 'urgent',
    minMatches: 3,
    triggerGroups: [
      ['fever', 'temperature', 'hot', 'feverish', 'high temperature'],
      ['headache', 'head pain', 'head ache'],
      ['chills', 'shivering', 'cold', 'sweating', 'sweats', 'night sweats', 'body ache', 'body pain', 'weakness', 'fatigue', 'tired', 'vomiting', 'nausea', 'joint pain', 'bone pain'],
    ],
    patientGuidance: 'Your symptoms are consistent with what malaria commonly feels like in Nigeria. You should see a clinician today for a rapid test to confirm.',
    immediateAction: 'Rest and drink plenty of fluids. Take paracetamol (not aspirin) for fever — 500mg to 1g for adults, appropriate dose for children. Do not start anti-malaria treatment without a confirmed test result. See a clinician today.',
    recommendedTests: ['Malaria Rapid Diagnostic Test (RDT)', 'Blood film (thick and thin)', 'Full Blood Count', 'Packed Cell Volume (PCV)', 'Random Blood Glucose'],
    clinicianNotes: 'Nigeria is hyperendemic — malaria should be considered in any febrile patient. RDT is standard first-line. If positive, treat per FMOH protocol: uncomplicated P. falciparum → Artemether-Lumefantrine (AL). Severe malaria → IV Artesunate. Check for anaemia, glucose, signs of cerebral malaria. In pregnancy, use quinine or IV artesunate, not AL in 1st trimester.',
  },

  {
    id: 'typhoid-suspected',
    name: 'Suspected Typhoid',
    urgency: 'urgent',
    minMatches: 3,
    triggerGroups: [
      ['fever', 'temperature', 'hot', 'feverish'],
      ['days', 'week', 'weeks', 'prolonged', 'continuous', 'persistent', 'ongoing'],
      ['abdominal', 'abdomen', 'stomach', 'belly', 'tummy', 'headache', 'weakness', 'loss of appetite', 'no appetite', 'constipation', 'diarrhoea', 'diarrhea', 'rose spots', 'rash', 'slow pulse'],
    ],
    patientGuidance: 'A fever lasting several days with stomach symptoms can have several causes including typhoid, which is common in Nigeria. You should be evaluated today.',
    immediateAction: 'Rest and stay well hydrated with clean water or ORS. Take paracetamol for fever. Avoid dairy, raw foods, and street food. See a clinician today — do not start antibiotics without a confirmed diagnosis.',
    recommendedTests: ['Widal Test (note limitations)', 'Blood culture (gold standard — if available)', 'Full Blood Count', 'Liver function tests', 'Stool culture'],
    clinicianNotes: 'Widal is widely used but has poor specificity in endemic areas — blood culture is gold standard where available. Classic presentation: stepwise fever, relative bradycardia, rose spots, splenomegaly. Treat per FMOH: Azithromycin or Ciprofloxacin (check local resistance patterns). Admit if unable to tolerate oral intake, severe illness, or complications (perforation, bleeding).',
  },

  {
    id: 'hypertensive-urgency',
    name: 'Hypertensive Urgency / Crisis',
    urgency: 'urgent',
    minMatches: 2,
    triggerGroups: [
      ['blood pressure', 'BP', 'hypertension', 'high BP', 'high blood pressure', 'pressure is high', 'pressure very high'],
      ['headache', 'severe headache', 'blurred vision', 'vision', 'dizziness', 'nosebleed', 'nausea', 'vomiting', 'chest pain', 'palpitations', 'heart pounding', 'no medication', 'missed medication', 'ran out'],
    ],
    patientGuidance: 'Very high blood pressure with these symptoms needs to be checked today by a clinician, especially if you have been without your medication.',
    immediateAction: 'Sit quietly and rest. Avoid stress and physical exertion. Do not take extra doses of BP medication without a doctor\'s guidance. If you have your regular medication and have missed a dose, take it now. Go to a clinic or hospital today — do not wait until tomorrow.',
    recommendedTests: ['Blood pressure (both arms)', 'Urinalysis (protein)', 'ECG', 'Random Blood Sugar', 'Urea and Creatinine', 'Fundoscopy if available'],
    clinicianNotes: 'Hypertensive urgency: severe elevation (>180/120) without end-organ damage. Hypertensive emergency: same + end-organ damage (encephalopathy, MI, AKI, retinopathy grade III/IV). Reduce BP gradually over hours in urgency, over minutes in emergency. Common in Nigeria: poorly controlled essential HTN, medication non-compliance, salt intake, renal disease.',
  },

  {
    id: 'diabetic-concern',
    name: 'Diabetic Complication / Uncontrolled Glucose',
    urgency: 'urgent',
    minMatches: 2,
    triggerGroups: [
      ['diabetes', 'diabetic', 'blood sugar', 'glucose', 'insulin', 'sugar level', 'sugar is high', 'sugar is low'],
      ['very thirsty', 'urinating frequently', 'frequent urination', 'passing urine often', 'fruity breath', 'confusion', 'very weak', 'dizzy', 'shaking', 'sweating', 'unconscious', 'faint', 'vomiting', 'abdominal pain', 'not eating', 'missed insulin', 'ran out of medication'],
    ],
    patientGuidance: 'These symptoms in someone with diabetes need medical attention today to check your blood sugar and avoid complications.',
    immediateAction: 'If you feel shaky, sweaty, or confused and think your sugar may be LOW — eat or drink something sugary immediately (e.g. sugar dissolved in water, glucose tablets, a sweet drink). If you think sugar is HIGH — drink water and seek care today. Do not skip your medications.',
    recommendedTests: ['Random Blood Glucose (urgent)', 'HbA1c', 'Urine ketones', 'Urea and Creatinine', 'Electrolytes', 'Urinalysis'],
    clinicianNotes: 'Differentiate hypoglycaemia (low glucose — treat immediately with IV/oral dextrose) from DKA (high glucose + ketoacidosis — IV fluids, insulin, electrolyte correction) and HHS (very high glucose, minimal ketones, usually elderly T2DM). Check for precipitating infection. Assess feet in T2DM for ulcers.',
  },

  {
    id: 'paediatric-severe-fever',
    name: 'Severe Fever in Child / Infant',
    urgency: 'urgent',
    minMatches: 2,
    triggerGroups: [
      ['child', 'baby', 'infant', 'toddler', 'son', 'daughter', 'years old', 'months old', 'my kid', 'the child'],
      ['very high fever', 'very hot', 'temperature very high', 'convulsion', 'fitting', 'seizure', 'shaking', 'not eating', 'refusing food', 'refusing breast', 'very weak', 'drowsy', 'not responding', 'stiff', 'rash', 'yellow eyes', 'difficulty breathing'],
    ],
    patientGuidance: 'A high fever with these symptoms in a child needs prompt medical evaluation today. Children can worsen quickly — it\'s best to be seen soon.',
    immediateAction: 'Give paracetamol syrup at the correct dose for the child\'s weight to bring the fever down. Remove excess clothing. Offer fluids frequently — breast milk for infants. If the child has a convulsion: lay them on their side, do not put anything in the mouth, do not restrain them, note how long it lasts, and go to the hospital immediately after.',
    recommendedTests: ['Malaria RDT', 'Full Blood Count + differential', 'Blood glucose', 'Packed Cell Volume (PCV)', 'Urinalysis', 'Blood culture if very ill'],
    clinicianNotes: 'Apply WHO IMCI framework: assess for general danger signs (unable to drink, persistent vomiting, convulsions, lethargy). In Nigeria febrile children: malaria is most common cause — test all. Pneumonia (fast breathing, chest indrawing), meningitis (neck stiffness, bulging fontanelle in infants), sepsis. Treat fever: Paracetamol 15mg/kg q6h. Febrile convulsion vs epilepsy — assess if first episode.',
  },

  {
    id: 'acute-abdomen',
    name: 'Acute Abdominal Pain',
    urgency: 'urgent',
    minMatches: 2,
    triggerGroups: [
      ['severe abdominal', 'severe stomach', 'severe belly', 'severe abdomen', 'very bad stomach pain', 'stomach pain very bad', 'sharp pain in stomach', 'sharp pain in abdomen', 'cannot bear', 'unbearable pain'],
      ['fever', 'vomiting', 'rigid', 'guarding', 'rebound', 'bloating', 'swollen abdomen', 'no bowel movement', 'no stool', 'blood in stool', 'yellow', 'jaundice', 'right side', 'right lower'],
    ],
    patientGuidance: 'Severe abdominal pain with these symptoms needs medical evaluation today. Several conditions can cause this and some need prompt treatment.',
    immediateAction: 'Rest and avoid eating or drinking until you\'ve been seen by a clinician — some conditions affecting the abdomen need this precaution. Go to a hospital with surgical capacity today. Take note of when the pain started and exactly where it is.',
    recommendedTests: ['Abdominal ultrasound', 'Full Blood Count', 'Urea and Creatinine', 'Liver function tests', 'Urinalysis', 'Pregnancy test if applicable', 'Abdominal X-ray (erect)'],
    clinicianNotes: 'Differential: appendicitis (RIF pain, migration, rebound), peptic ulcer disease/perforation (sudden severe epigastric, rigid abdomen), biliary colic/cholecystitis (RUQ, fatty food history), intestinal obstruction (colicky pain, distension, vomiting, no flatus), ectopic pregnancy (lower abdominal, amenorrhoea, shoulder tip pain). Surgical referral if peritonism present.',
  },

  {
    id: 'urinary-infection',
    name: 'Urinary Tract / Kidney Infection',
    urgency: 'urgent',
    minMatches: 2,
    triggerGroups: [
      ['urine', 'urinating', 'urination', 'passing urine', 'peeing', 'pee', 'toilet', 'wee'],
      ['burning', 'pain when urinating', 'frequent', 'blood in urine', 'cloudy urine', 'smelly urine', 'back pain', 'loin pain', 'flank pain', 'fever', 'chills', 'lower abdominal pain', 'lower belly pain'],
    ],
    patientGuidance: 'Your symptoms suggest a possible urinary infection. This is treatable, but needs to be confirmed by a clinician, especially if you have fever or back pain.',
    immediateAction: 'Drink plenty of clean water — at least 2-3 litres today. Avoid holding urine for long periods. A clinician needs to test your urine to confirm the diagnosis before starting antibiotics. See a clinician today or tomorrow.',
    recommendedTests: ['Urinalysis (dipstick)', 'Urine microscopy culture & sensitivity (MCS)', 'Blood pressure', 'Urea and Creatinine (if suspected kidney involvement)'],
    clinicianNotes: 'Uncomplicated lower UTI in non-pregnant women: Nitrofurantoin or Trimethoprim (check local sensitivity). Complicated UTI / pyelonephritis (fever + loin pain): blood cultures, IV antibiotics if systemically unwell. In men: consider prostatitis. In pregnancy: treat all UTIs even if asymptomatic — risk of preterm labour. Always check for underlying DM.',
  },

  {
    id: 'mental-health-crisis',
    name: 'Mental Health Crisis',
    urgency: 'urgent',
    minMatches: 2,
    triggerGroups: [
      ['suicidal', 'suicide', 'kill myself', 'end my life', 'want to die', 'don\'t want to live', 'no reason to live', 'harm myself', 'self-harm', 'hurt myself'],
      ['thinking about', 'plan', 'decided', 'will do it', 'going to', 'feeling hopeless', 'no hope', 'cannot continue'],
    ],
    patientGuidance: 'What you\'re describing sounds very difficult, and your feelings matter. You don\'t have to face this alone — speaking with someone right now can help.',
    immediateAction: 'Please reach out to someone you trust right now — a family member, friend, or religious leader. In Nigeria you can also call the Mentally Aware Nigeria Initiative (MANI) helpline. Go to the nearest hospital if you feel you may act on these thoughts. A clinician in this app will also respond to you.',
    recommendedTests: [],
    clinicianNotes: 'IMMEDIATE PRIORITY. Assess suicide risk: plan, means, intent, timeline, protective factors (family, religion, reasons for living). Do not leave patient alone if high risk. Refer to psychiatry. In Nigeria: consult at LUTH, UCH, or nearest neuropsychiatric hospital. Be aware of stigma — maintain non-judgmental tone. Document carefully.',
  },
]

/**
 * Run the protocols against a patient's full symptom text.
 * Returns the highest-urgency protocol that fires, or null if none match.
 *
 * "Full symptom text" = primary complaint + all checklist Q&A answers,
 * concatenated and lowercased.
 */
export function evaluateProtocols(fullSymptomText: string): Protocol | null {
  const text = fullSymptomText.toLowerCase()

  let highestMatch: Protocol | null = null
  const urgencyRank: Record<Urgency, number> = { emergency: 2, urgent: 1, routine: 0 }

  for (const protocol of PROTOCOLS) {
    // Count how many trigger groups have at least one matching term
    const groupMatches = protocol.triggerGroups.filter((group) =>
      group.some((term) => text.includes(term.toLowerCase()))
    ).length

    if (groupMatches >= protocol.minMatches) {
      if (
        !highestMatch ||
        urgencyRank[protocol.urgency] > urgencyRank[highestMatch.urgency]
      ) {
        highestMatch = protocol
      }
    }
  }

  return highestMatch
}

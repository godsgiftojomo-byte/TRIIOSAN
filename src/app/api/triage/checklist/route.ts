import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, TRIAGE_MODEL } from '@/lib/anthropic/client'
import { buildChecklistPrompt, buildFollowUpPrompt, parseModelJson } from '@/lib/anthropic/prompts'
import type { Language, ChecklistItem } from '@/lib/supabase/types'

/**
 * Stage 1: Generate WHO/FMOH base questions (fixed clinical axes).
 * Stage 2: Generate AI follow-up questions based on complaint + base answers.
 *
 * Both stages return { questions: string[] }.
 */
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const complaint: string = (body?.complaint || '').trim()
  const language: Language = body?.language || 'en'
  const stage: 1 | 2 = body?.stage || 1
  const baseAnswers: ChecklistItem[] = body?.baseAnswers || []

  if (!complaint) {
    return NextResponse.json({ error: 'complaint is required' }, { status: 400 })
  }

  // ── Stage 1: WHO/FMOH base questions ─────────────────────────────
  if (stage === 1) {
    // These are grounded in WHO IMCI + Nigerian FMOH Primary Healthcare
    // triage intake standards. They cover the universal clinical axes
    // that matter for any presenting complaint.
    const baseQuestions = BASE_QUESTIONS[language] || BASE_QUESTIONS.en
    return NextResponse.json({ questions: baseQuestions, stage: 1 })
  }

  // ── Stage 2: AI-generated complaint-specific follow-ups ───────────
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[checklist/stage2] ANTHROPIC_API_KEY not set')
    return NextResponse.json({
      questions: FALLBACK_QUESTIONS[language] || FALLBACK_QUESTIONS.en,
      stage: 2,
      aiUnavailable: true,
    })
  }

  try {
    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: TRIAGE_MODEL,
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: buildFollowUpPrompt(complaint, baseAnswers, language),
        },
      ],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text block')

    const parsed = parseModelJson<{ questions: string[] }>(textBlock.text)
    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((q): q is string => typeof q === 'string').slice(0, 6)
      : []

    if (questions.length === 0) throw new Error('No questions returned')

    return NextResponse.json({ questions, stage: 2 })
  } catch (err) {
    console.error('[checklist/stage2] AI error:', err instanceof Error ? err.message : err)
    return NextResponse.json({
      questions: FALLBACK_QUESTIONS[language] || FALLBACK_QUESTIONS.en,
      stage: 2,
      aiUnavailable: true,
    })
  }
}

/**
 * WHO/FMOH-grounded base questions — universal clinical intake axes.
 * Sources: WHO IMCI guidelines, Nigerian FMOH Primary Healthcare
 * triage intake protocols, standard nursing triage intake standards.
 * These 6 questions apply regardless of presenting complaint.
 */
const BASE_QUESTIONS: Record<Language, string[]> = {
  en: [
    'How long have you had this symptom or complaint? (e.g. a few hours, 3 days, 2 weeks)',
    'On a scale of 1 to 10, how severe is the discomfort or pain right now? (1 = very mild, 10 = worst possible)',
    'Is the problem getting worse, getting better, or staying about the same?',
    'Have you had this same problem before? If yes, when and what happened?',
    'Are you currently taking any medications, herbal remedies, or supplements? If yes, please list them.',
    'Do you have any known medical conditions — such as diabetes, high blood pressure, asthma, HIV, or any chronic illness?',
  ],
  yo: [
    'Ìgbà mélòó ni o ti ní àmì àìsàn tàbí ìrora yìí? (fún àpẹẹrẹ: wákàtí díẹ̀, ọjọ́ mẹ́ta, ọ̀sẹ̀ méjì)',
    'Lórí ìwọ̀n 1 sí 10, báwo ni ìrora tàbí ìbànújẹ́ náà ṣe le tó báyìí? (1 = rírọ̀, 10 = burú jáì)',
    'Njẹ́ ọrọ̀ náà ń burú sí i, ń dára sí i, tàbí ò yí padà?',
    'Ṣé o ti ní ìṣòro kanna yìí rí? Tí bẹ́ẹ̀ bá jẹ́, nígbà wo àti kí ló ṣẹlẹ̀?',
    'Ṣé o ń mu òògùn kankan, èwe, tàbí àfikún ilera? Tí bẹ́ẹ̀ bá jẹ́, jọ̀wọ́ kà wọn.',
    'Ṣé o ní àìsàn tó mọ̀ — bí àtọ̀gbẹ, ẹ̀jẹ̀ rírọ gíga, àárọ̀, HIV, tàbí àìsàn àìsàn mìíràn?',
  ],
  ha: [
    'Tsawon lokaci nawa kake da wannan alamar ko korafi? (misali: 'yan awanni, kwana 3, makonni 2)',
    'A kan ma'aunin 1 zuwa 10, yaya tsananin ciwo ko rashin jin daɗi yake yanzu? (1 = mai laushi, 10 = mafi muni)',
    'Matsalar na ta yin muni, ta inganta, ko ta kasance iri ɗaya?',
    'Shin kun taɓa samun wannan matsala dā? Idan haka ne, yaushe kuma me ya faru?',
    'Shin kuna shan wani magani, magunguna na ganye, ko ƙari? Idan haka ne, don Allah jera su.',
    'Shin kuna da wata cuta da aka sani — kamar sikari, hawan jini, asma, HIV, ko wata cuta ta dā?',
  ],
  ig: [
    'Ọ dị afọ ole ka i nwere ihe a ọ bụ oke ya? (dịka: awa ole, ụbọchị 3, izu 2)',
    'N\'ọnụ ọgụgụ 1 ruo 10, olee otú oke ọnọdụ ọjọọ ahụ bụ ugbu a? (1 = dị mfe, 10 = njọ karia)',
    'Nsogbu ahụ na-abawanye, na-eji mma, ma ọ bụ na-adịgide otu aka?',
    'I nwere nsogbu a ọzọ n\'oge gara aga? Ọ bụrụ n\'eyo, mgbe ole na-ole na gịnị mere?',
    'Ị na-eji ọgwụ ọ bụla, ọgwụ osisi, ma ọ bụ mgbakwunye ugbu a? Ọ bụrụ n\'eyo, biko depụta ha.',
    'I nwere ọrịa ọ bụla a maara — dịka ọ bụ shuga, ọbara ọbara dị elu, ọrịa ume, HIV, ma ọ bụ ọrịa ogologo oge?',
  ],
  pcm: [
    'How long you don get this symptom or problem? (e.g. few hours, 3 days, 2 weeks)',
    'For scale of 1 to 10, how bad the pain or discomfort dey be right now? (1 = small small, 10 = the worst)',
    'The problem dey get worse, dey get better, or e dey stay the same?',
    'You ever get this same problem before? If yes, when and wetin happen?',
    'You dey take any medicine, herbal remedy, or supplement now? If yes, abeg list them.',
    'You get any medical condition wey dem know — like diabetes, high blood pressure, asthma, HIV, or any long-long sickness?',
  ],
}

/**
 * Fallback follow-up questions used when the AI is unavailable.
 * These are common differential-diagnosis questions that apply broadly.
 */
const FALLBACK_QUESTIONS: Record<Language, string[]> = {
  en: [
    'Where exactly in your body do you feel this? Can you point to or describe the location?',
    'Does the pain or discomfort spread to any other part of your body?',
    'What makes it worse? (e.g. movement, eating, lying down, stress)',
    'What gives you any relief, even partial? (e.g. rest, a particular position, medication)',
    'Do you have any fever, chills, or night sweats?',
    'Have you noticed any changes in your appetite, weight, urine, or bowel movements recently?',
  ],
  yo: [
    'Ibo gangan ni o ń ní irora tàbí ìrora yìí nínú ara rẹ?',
    'Njẹ́ irora náà ń tàn sí ìdílé mìíràn ti ara rẹ?',
    'Kí ni ó ń jẹ́ kí ó burú sí i?',
    'Kí ni ó ń fúnni ní ìṣọ̀fọ̀?',
    'Njẹ́ o ní ìbà, ìrọ̀rọ̀ otutu, tàbí ìgbà?',
    'Ṣé o ṣàkíyèsí ìyípadà nínú jíjẹun, ìwọn ara, ìtọ̀, tàbí àgbẹ̀ rẹ laipẹ?',
  ],
  ha: [
    'A ina daidai cikin jikinka kake jin wannan? Kuna iya nuna ko bayyana wurin?',
    'Shin ciwo ko rashin jin daɗi yana yaduwa zuwa wani ɓangare na jikinku?',
    'Mene ne yake sa ya yi muni? (misali: motsi, cin abinci, kwanciya, damuwa)',
    'Mene ne ke ba ku sauƙi, ko da ɗan sauƙi? (misali: huta, wata matsayi, magani)',
    'Kuna da zazzabi, sanyi, ko ƙararraki da daddare?',
    'Kun lura da wasu canje-canje a cikin sha'awar abincin ku, nauyi, fitsari, ko motsin hanji kwanan nan?',
  ],
  ig: [
    'Ebe ole kwa n\'ahụ gị i nọ na-anwụnye? Ị nwere ike igosi ma ọ bụ kọwaa ebe ahụ?',
    'Ọ bụ ezie na ọnọdụ ọjọọ ahụ na-agbasa na akụkụ ọzọ nke ahụ gị?',
    'Gịnị na-eme ka ọ bụrụ njọ karịa?',
    'Gịnị na-enye gị oge ike, ọ bụrụ naanị obere?',
    'I nwere ọkụ ọkụ n\'ahụ, oyi, ma ọ bụ ọchịchọ na abalị?',
    'I hụrụ mgbanwe ọ bụla na mkpa nri, ibu, mmiri ike, ma ọ bụ mmụọ ime ụbọchị n\'oge na-adịghị anya?',
  ],
  pcm: [
    'Where exactly for your body you dey feel this? You fit point or describe the place?',
    'The pain or discomfort dey spread to any other part of your body?',
    'Wetin dey make am worse? (e.g. movement, eating, lying down, stress)',
    'Wetin dey give you relief, even small relief? (e.g. rest, certain position, medicine)',
    'You get fever, cold, or night sweating?',
    'You notice any changes in your appetite, weight, urine, or toilet recently?',
  ],
}

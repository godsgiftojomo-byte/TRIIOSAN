import { NextResponse } from 'next/server'
import { createUntypedClient } from '@/lib/supabase/untyped'
import Anthropic from '@anthropic-ai/sdk'

import { getAnthropicClient, TRIAGE_MODEL } from '@/lib/anthropic/client'
import { buildChecklistPrompt, parseModelJson } from '@/lib/anthropic/prompts'
import type { Language } from '@/lib/supabase/types'

interface ChecklistResponse {
  questions: string[]
}

export async function POST(request: Request) {
  const supabase = createUntypedClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const complaint: string = (body?.complaint || '').trim()
  const language: Language = body?.language || 'en'

  if (!complaint) {
    return NextResponse.json({ error: 'complaint is required' }, { status: 400 })
  }

  if (complaint.length > 2000) {
    return NextResponse.json({ error: 'complaint is too long' }, { status: 400 })
  }

  try {
    const anthropic = getAnthropicClient()

    const message = await anthropic.messages.create({
      model: TRIAGE_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: buildChecklistPrompt(complaint, language) }],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from model')
    }

    const parsed = parseModelJson<ChecklistResponse>(textBlock.text)

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      throw new Error('Model returned no questions')
    }

    return NextResponse.json({ questions: parsed.questions.slice(0, 6) })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error('checklist generation error [Anthropic.APIError]:', {
        status: err.status,
        name: err.name,
        message: err.message,
      })
    } else {
      console.error('checklist generation error [unknown]:', err)
    }

    const fallback: Record<Language, string[]> = {
      en: [
        'How long have you had this problem?',
        'How severe is it — mild, moderate, or severe?',
        'Have you taken any medication for this already?',
        'Do you have any other ongoing health conditions (e.g. diabetes, high blood pressure)?',
        'Have you had a fever?',
      ],
      yo: [
        'Igba melo ni o ti ní ìṣòro yìí?',
        'Bawo ni o ṣe le — kekere, dede, tabi nla?',
        'Ṣe o ti mu oogun kankan fun eyi tẹlẹ?',
        'Ṣe o ni àìsàn miiran bi suga tabi ẹjẹ riro?',
        'Ṣe o ti ní ibà?',
      ],
      ha: [
        'Tun yaushe kake da wannan matsalar?',
        'Yaya tsananin sa — kadan, matsakaici, ko mai tsanani?',
        'Ka sha wani magani don wannan tuni?',
        'Kana da wata cuta da kake fama da ita (misali ciwon suga, hawan jini)?',
        'Kana da zazzaɓi?',
      ],
      ig: [
        'Ogologo oge ole ka ị nwere nsogbu a?',
        'Kedu otú o si dị njọ — nta, dị nso, ma ọ bụ oke?',
        'Ị ṅụọla ọgwụ maka nke a?',
        'Ị nwere ọrịa ọzọ ị na-agwọ (dịka shuga, ọbara mgbali elu)?',
        'Ị nwere ahụ́ ọkụ?',
      ],
      pcm: [
        'How long you don dey feel like this?',
        'How bad e be — small, medium, or e serious?',
        'You don take any medicine for this before?',
        'You get any other sickness wey you dey manage (like sugar, high BP)?',
        'You get fever?',
      ],
    }

    return NextResponse.json({
      questions: fallback[language] || fallback.en,
      _debugError:
        err instanceof Anthropic.APIError
          ? `[Anthropic.APIError ${err.status}] ${err.message}`
          : err instanceof Error
            ? `[${err.name}] ${err.message}`
            : String(err),
    })
  }
}

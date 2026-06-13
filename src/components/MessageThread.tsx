'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { CaseMessage, UserRole } from '@/lib/supabase/types'

export function MessageThread({
  caseId,
  currentUserId,
  currentUserRole,
  initialMessages,
  disabled,
}: {
  caseId: string
  currentUserId: string
  currentUserRole: UserRole
  initialMessages: CaseMessage[]
  disabled?: boolean
}) {
  const { t } = useLanguage()
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [messages, setMessages] = useState<CaseMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`case_messages:${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'case_messages',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          const newMessage = payload.new as CaseMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || sending) return

    setSending(true)
    setDraft('')

    const { data: dataRaw, error } = await supabase
      .from('case_messages')
      .insert({
        case_id: caseId,
        sender_id: currentUserId,
        sender_role: currentUserRole,
        message: text,
      })
      .select()
      .single()

    const data = dataRaw as CaseMessage | null

    if (!error && data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev
        return [...prev, data]
      })
    } else {
      console.error('send message error:', error)
      setDraft(text)
    }

    setSending(false)
  }

  return (
    <div className="card flex flex-col">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink/40">
        {t('thread.title')}
      </h3>

      <div className="flex max-h-96 min-h-[120px] flex-col gap-2 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-ink/40">{t('thread.waitingForClinician')}</p>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                isMine
                  ? 'self-end bg-ember text-white'
                  : 'self-start bg-ink-50 text-ink'
              }`}
            >
              {msg.message}
              <div className={`mt-1 text-[10px] ${isMine ? 'text-white/70' : 'text-ink/40'}`}>
                {new Date(msg.created_at).toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {!disabled && (
        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('thread.placeholder')}
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ember text-white transition-colors hover:bg-ember-dark disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      )}
    </div>
  )
}

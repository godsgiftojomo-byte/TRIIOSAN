'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, CheckCheck, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { CaseMessage, UserRole } from '@/lib/supabase/types'

export function MessageThread({
  caseId,
  currentUserId,
  currentUserRole,
  initialMessages,
  disabled = false,
}: {
  caseId: string
  currentUserId: string
  currentUserRole: UserRole
  initialMessages: CaseMessage[]
  disabled?: boolean
}) {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<CaseMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`thread-${caseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'case_messages', filter: `case_id=eq.${caseId}` },
        (payload) => {
          const newMsg = payload.new as CaseMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [caseId, supabase])

  async function sendMessage() {
    const text = draft.trim()
    if (!text || sending || disabled) return

    setSending(true)
    setDraft('')

    const { error } = await supabase.from('case_messages').insert({
      case_id: caseId,
      sender_id: currentUserId,
      sender_role: currentUserRole,
      message: text,
    })

    if (error) {
      console.error('send error:', error)
      setDraft(text) // restore draft if send failed
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(ts: string) {
    const d = new Date(ts)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' })
  }

  // Group messages by date
  const grouped: { date: string; msgs: CaseMessage[] }[] = []
  for (const msg of messages) {
    const date = formatDate(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.date === date) {
      last.msgs.push(msg)
    } else {
      grouped.push({ date, msgs: [msg] })
    }
  }

  return (
    <div className="card overflow-hidden p-0 flex flex-col">
      {/* Header */}
      <div className="border-b border-ink/8 dark:border-dark-border px-4 py-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-ink dark:text-dark-text">
          {t('thread.title')}
        </h3>
        {disabled && (
          <span className="rounded-full bg-ink/8 dark:bg-dark-border px-2.5 py-0.5 text-xs font-semibold text-ink/50 dark:text-dark-muted">
            {t('thread.statusClosed')}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 max-h-[400px]">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-ink/40 dark:text-dark-muted">
              {currentUserRole === 'patient'
                ? t('thread.waitingForClinician')
                : t('thread.noMessages')}
            </p>
          </div>
        )}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-ink/8 dark:bg-dark-border" />
              <span className="text-xs font-semibold text-ink/30 dark:text-dark-muted">{date}</span>
              <div className="flex-1 h-px bg-ink/8 dark:bg-dark-border" />
            </div>

            {msgs.map((msg, i) => {
              const isOwn = msg.sender_id === currentUserId
              const isConsecutive = i > 0 && msgs[i - 1].sender_id === msg.sender_id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}
                >
                  <div className={`max-w-[78%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Sender label — only on first in a group */}
                    {!isConsecutive && !isOwn && (
                      <span className="mb-1 pl-1 text-xs font-semibold text-ink/40 dark:text-dark-muted">
                        {msg.sender_role === 'clinician' ? 'Clinician' : 'You'}
                      </span>
                    )}
                    <div className={isOwn ? 'bubble-patient' : 'bubble-clinician'}>
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                    <div className={`mt-0.5 flex items-center gap-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] text-ink/30 dark:text-dark-muted">
                        {formatTime(msg.created_at)}
                      </span>
                      {isOwn && (
                        msg.read_at
                          ? <CheckCheck className="h-3 w-3 text-urgency-routine" />
                          : <Clock className="h-3 w-3 text-ink/20 dark:text-dark-muted" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!disabled ? (
        <div className="border-t border-ink/8 dark:border-dark-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('thread.placeholder')}
              rows={1}
              disabled={sending}
              className="input min-h-[44px] max-h-32 resize-none py-2.5 text-sm leading-relaxed"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 128) + 'px'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
              className="btn-primary h-11 w-11 shrink-0 rounded-xl p-0"
              aria-label={t('thread.send')}
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-ink/30 dark:text-dark-muted px-1">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      ) : (
        <div className="border-t border-ink/8 dark:border-dark-border px-4 py-3 text-center">
          <p className="text-xs text-ink/40 dark:text-dark-muted">{t('thread.closedNotice')}</p>
        </div>
      )}
    </div>
  )
}

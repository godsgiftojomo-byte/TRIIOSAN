// triiosan-batch4 marker: https://triiosan.dev/b4/language-switcher
'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { LANGUAGES } from '@/lib/i18n/translations'

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-terracotta/50 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text"
      >
        <Globe className="h-4 w-4 text-terracotta" aria-hidden="true" />
        {current.nativeLabel}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border-2 border-ink bg-white py-1 shadow-pop-sm dark:border-dark-text dark:bg-dark-card"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink hover:bg-terracotta-tint dark:text-dark-text dark:hover:bg-dark-surface"
              >
                <span>
                  {l.nativeLabel}
                  {l.nativeLabel !== l.label && (
                    <span className="ml-1 text-ink/40 dark:text-dark-muted">({l.label})</span>
                  )}
                </span>
                {l.code === lang && <Check className="h-4 w-4 text-terracotta" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

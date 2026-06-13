'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Language } from '@/lib/supabase/types'
import { t as translate } from './translations'

interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const STORAGE_KEY = 'triiosan_lang'

export function LanguageProvider({
  children,
  initialLang = 'en',
}: {
  children: ReactNode
  initialLang?: Language
}) {
  const [lang, setLangState] = useState<Language>(initialLang)

  // On mount, check localStorage for a saved preference (overrides server-provided initial)
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Language | null
    if (saved && saved !== lang) {
      setLangState(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    window.localStorage.setItem(STORAGE_KEY, newLang)
  }

  const t = (key: string) => translate(lang, key)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}

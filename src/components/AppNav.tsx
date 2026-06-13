'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, History, LogOut, LayoutList } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/supabase/types'

export function AppNav({ role, fullName }: { role: UserRole; fullName: string }) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const patientLinks = [
    { href: '/dashboard', label: t('nav.newCase'), icon: Plus },
    { href: '/history', label: t('nav.history'), icon: History },
  ]

  const clinicianLinks = [
    { href: '/clinician', label: t('nav.queue'), icon: LayoutList },
  ]

  const links = role === 'clinician' ? clinicianLinks : patientLinks

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-cream/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link href={role === 'clinician' ? '/clinician' : '/dashboard'}>
          <Wordmark className="text-lg sm:text-xl" />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-ember-50 text-ember' : 'text-ink/60 hover:text-ink'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-medium text-ink/60 sm:inline">{fullName}</span>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={handleSignOut}
            title={t('nav.signOut')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/60 transition-colors hover:text-ember"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-ink/5 px-4 py-2 sm:hidden">
        {links.map((link) => {
          const Icon = link.icon
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? 'bg-ember-50 text-ember' : 'text-ink/60'
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}

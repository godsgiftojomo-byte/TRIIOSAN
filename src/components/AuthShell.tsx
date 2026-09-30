// triiosan-batch3 marker: https://triiosan.dev/b3/auth-shell
import type { CSSProperties, ReactNode } from 'react'
import { Stethoscope, HeartPulse } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'

/**
 * Shared frame for every sign-in / sign-up screen.
 * patient   = terracotta band on a cream page
 * clinician = indigo band on an ink page (always dark)
 */
export function AuthShell({
  variant = 'patient',
  label,
  children,
}: {
  variant?: 'patient' | 'clinician'
  label: string
  children: ReactNode
}) {
  const clinician = variant === 'clinician'
  const Icon = clinician ? Stethoscope : HeartPulse

  const tile = { ['--art-size' as string]: '130px' } as CSSProperties
  const clinicianCardShadow: CSSProperties = { boxShadow: '4px 4px 0 0 #F5A623' }

  return (
    <div
      className={
        clinician ? 'flex min-h-screen flex-col bg-ink' : 'flex min-h-screen flex-col bg-cream dark:bg-dark-bg'
      }
    >
      {/* Colour band */}
      <div
        className={`relative overflow-hidden px-6 pb-20 pt-10 text-center ${
          clinician ? 'section-indigo' : 'section-terracotta'
        }`}
      >
        <div
          aria-hidden
          className={`art ${clinician ? 'art-adinkra-4' : 'art-adinkra-2'} art-tile art-faint absolute inset-0 text-cream`}
          style={tile}
        />
        <div className="relative">
          <Wordmark className="justify-center text-3xl" inverted />
          <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-marigold px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-ink shadow-pop-sm">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </p>
        </div>
      </div>

      {/* Card overlaps the band */}
      <div className="relative -mt-10 flex flex-1 flex-col items-center px-4 pb-12">
        <div className="w-full max-w-sm">
          {clinician ? (
            <div
              className="rounded-2xl border-2 border-marigold bg-dark-card p-6"
              style={clinicianCardShadow}
            >
              {children}
            </div>
          ) : (
            <div className="card-pop p-6">{children}</div>
          )}
        </div>
      </div>
    </div>
  )
}

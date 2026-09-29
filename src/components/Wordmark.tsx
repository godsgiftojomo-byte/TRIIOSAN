// triiosan-batch1 marker: https://triiosan.dev/b1/wordmark
import { cn } from '@/lib/utils'

export function Wordmark({
  className,
  inverted = false,
}: {
  className?: string
  /** Use on ink/terracotta/indigo backgrounds: "Trii" turns cream. */
  inverted?: boolean
}) {
  return (
    <span
      className={cn(
        'font-display text-2xl font-extrabold tracking-tight',
        className
      )}
    >
      <span className={inverted ? 'text-cream' : 'text-ink dark:text-dark-text'}>
        Trii
      </span>
      <span className={inverted ? 'text-marigold' : 'text-terracotta'}>osan</span>
    </span>
  )
}

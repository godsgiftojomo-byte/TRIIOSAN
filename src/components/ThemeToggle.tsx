'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Read stored preference
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    const pref = stored || 'system'
    setTheme(pref)
    applyTheme(pref)

    // Listen for system preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => { if (theme === 'system') applyTheme('system') }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  function applyTheme(t: 'light' | 'dark' | 'system') {
    const isDark =
      t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
    setResolved(isDark ? 'dark' : 'light')
  }

  function toggle() {
    // Cycle: system → light → dark → system
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(next)
    localStorage.setItem('theme', next)
    applyTheme(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
      className="btn-ghost h-9 w-9 rounded-full p-0"
    >
      {resolved === 'dark'
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />
      }
    </button>
  )
}

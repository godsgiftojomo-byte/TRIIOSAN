import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Triiosan — Digital Health Triage',
  description: 'Know what to do before you reach the clinic. AI-powered triage for every Nigerian.',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FBF6F0' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1210' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('theme');
                  var isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className={`${plusJakarta.variable} ${dmSans.variable}`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}

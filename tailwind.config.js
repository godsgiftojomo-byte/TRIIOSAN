// triiosan-batch1 marker: https://triiosan.dev/b1/tailwind-config
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Brand palette (approved) ──────────────────────────────
        ink:   'rgb(22 17 14 / <alpha-value>)',   // #16110E
        cream: '#FBF3E4',
        terracotta: {
          DEFAULT: '#C8452C',
          dark:    '#A5351F',
          light:   '#E27A5F',
          tint:    '#F7DFD5',
        },
        marigold: {
          DEFAULT: '#F5A623',
          dark:    '#D98A0A',
          tint:    '#FDEBC8',
        },
        indigo: {
          DEFAULT: '#24378F',
          dark:    '#1A2870',
          light:   '#5A6CC0',
          tint:    '#DDE2F5',
        },

        // Legacy aliases: existing pages still say "ember".
        // They now resolve to terracotta, so nothing breaks mid-redesign.
        ember:         '#C8452C',
        'ember-dark':  '#A5351F',
        'ember-light': '#E27A5F',

        // ── Dark mode surfaces (warm, ink-based) ──────────────────
        dark: {
          bg:      '#120E0B',
          surface: '#1A1410',
          card:    '#211A15',
          border:  '#34291F',
          text:    '#F1E6D2',
          muted:   '#A69581',
        },

        // ── Triage colors (SEPARATE from brand, unchanged) ────────
        'urgency-emergency':    '#C23B22',
        'urgency-emergency-bg': '#FDF0EE',
        'urgency-urgent':       '#D68F24',
        'urgency-urgent-bg':    '#FEF8EC',
        'urgency-routine':      '#347A66',
        'urgency-routine-bg':   '#EDF7F4',
        'urgency-emergency-dark-bg': '#2A1410',
        'urgency-urgent-dark-bg':    '#241D08',
        'urgency-routine-dark-bg':   '#0E2018',
      },
      // lets existing classes like border-ink/8 actually work
      opacity: {
        8: '0.08',
        12: '0.12',
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgb(22 17 14 / 0.07), 0 1px 2px -1px rgb(22 17 14 / 0.05)',
        'card-dark':'0 1px 3px 0 rgb(0 0 0 / 0.35), 0 1px 2px -1px rgb(0 0 0 / 0.25)',
        // hard offset "sticker" shadows
        pop:        '4px 4px 0 0 #16110E',
        'pop-sm':   '2px 2px 0 0 #16110E',
        'pop-dark': '4px 4px 0 0 #000000',
      },
      borderColor: {
        DEFAULT: 'rgb(22 17 14 / 0.08)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
      },
    },
  },
  plugins: [],
}

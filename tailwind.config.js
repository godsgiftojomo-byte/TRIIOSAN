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
        display: ['var(--font-display)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body:    ['var(--font-body)',    'DM Sans',           'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand
        ink:        'rgb(22 36 33 / <alpha-value>)',
        ember:      '#E8622D',
        'ember-dark': '#C44818',
        'ember-light': '#F08050',
        cream:      '#FBF6F0',

        // Dark mode surfaces
        dark: {
          bg:      '#0F1210',
          surface: '#161C18',
          card:    '#1C2420',
          border:  '#2A3530',
          text:    '#D4E0DC',
          muted:   '#7A9490',
        },

        // Urgency — light
        'urgency-emergency':    '#C23B22',
        'urgency-emergency-bg': '#FDF0EE',
        'urgency-urgent':       '#D68F24',
        'urgency-urgent-bg':    '#FEF8EC',
        'urgency-routine':      '#347A66',
        'urgency-routine-bg':   '#EDF7F4',

        // Urgency — dark (muted backgrounds for dark surfaces)
        'urgency-emergency-dark-bg': '#2A1410',
        'urgency-urgent-dark-bg':    '#241D08',
        'urgency-routine-dark-bg':   '#0E2018',
      },
      boxShadow: {
        card:      '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-dark':'0 1px 3px 0 rgb(0 0 0 / 0.3),  0 1px 2px -1px rgb(0 0 0 / 0.2)',
      },
      borderColor: {
        DEFAULT: 'rgb(22 36 33 / 0.08)',
      },
    },
  },
  plugins: [],
}

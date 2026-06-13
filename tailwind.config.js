/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand
        ink: {
          DEFAULT: '#1A2421',
          light: '#2C3A35',
          50: '#F2F4F3',
        },
        ember: {
          DEFAULT: '#E8622D',
          dark: '#C94F1F',
          light: '#FCE8DD',
          50: '#FFF6F1',
        },
        cream: '#FBF6F0',

        // Urgency semantics
        urgency: {
          emergency: '#C23B22',
          'emergency-bg': '#FBE9E5',
          urgent: '#E8A23D',
          'urgent-bg': '#FDF3E3',
          routine: '#5C7A5E',
          'routine-bg': '#EBF1EC',
        },
        sage: '#8A9A8E',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(26, 36, 33, 0.08), 0 1px 2px -1px rgba(26, 36, 33, 0.08)',
      },
    },
  },
  plugins: [],
}

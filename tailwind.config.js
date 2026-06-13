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
          DEFAULT: 'rgb(26 36 33)',     // #1A2421
          light: 'rgb(44 58 53)',       // #2C3A35
          50: 'rgb(242 244 243)',       // #F2F4F3
        },
        ember: {
          DEFAULT: 'rgb(232 98 45)',    // #E8622D
          dark: 'rgb(201 79 31)',       // #C94F1F
          light: 'rgb(252 232 221)',    // #FCE8DD
          50: 'rgb(255 246 241)',       // #FFF6F1
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

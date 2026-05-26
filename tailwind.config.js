/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: '#C9A84C',
        guilder: {
          bg: '#FFFFFF',
          text: '#111111',
          border: '#E5E5E5',
          card: '#F8F8F8',
        },
        'guilder-dark': {
          bg: '#0D0D0D',
          text: '#FFFFFF',
          border: '#2A2A2A',
          card: '#1A1A1A',
        },
      },
      boxShadow: {
        fab: '0 4px 14px rgba(201, 168, 76, 0.45)',
      },
    },
  },
  plugins: [],
}

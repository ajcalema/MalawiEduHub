/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#e6f7f1',
          100: '#c0e8d8',
          200: '#8fd4b8',
          400: '#1aab78',
          500: '#0d7a55',
          600: '#0b6647',
          800: '#073d2b',
          900: '#041f16',
        },
        gold: {
          100: '#fdf4dc',
          400: '#d4a017',
          600: '#a07810',
        },
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease both',
        'fade-in':   'fadeIn 0.4s ease both',
        'slide-in':  'slideIn 0.4s ease both',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'none' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'none' } },
      },
    },
  },
  plugins: [],
}

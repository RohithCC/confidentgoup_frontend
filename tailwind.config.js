/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Confident Group brand: deep navy + luxury gold.
        navy: {
          50: '#eef2f8',
          100: '#d5deec',
          200: '#aebfd9',
          300: '#7d96bd',
          400: '#4f6da0',
          500: '#345086',
          600: '#27406d',
          700: '#1d3157',
          800: '#13233f', // primary surface
          900: '#0b1730', // deepest
          950: '#070f20',
        },
        gold: {
          50: '#fbf7ea',
          100: '#f5ecc7',
          200: '#ecd98c',
          300: '#e2c451',
          400: '#d4af37', // luxury gold accent
          500: '#bb9627',
          600: '#9a771f',
          700: '#7a5c1d',
          800: '#664c1f',
          900: '#583f1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11, 23, 48, 0.06), 0 1px 2px rgba(11, 23, 48, 0.04)',
        soft: '0 10px 30px -12px rgba(11, 23, 48, 0.18)',
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #0b1730 0%, #13233f 45%, #27406d 100%)',
        'gold-gradient': 'linear-gradient(135deg, #d4af37 0%, #bb9627 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './providers/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3474ac',
          50: '#eef5fb',
          100: '#d5e6f4',
          200: '#aecde9',
          300: '#7baed9',
          400: '#4f92c6',
          500: '#3474ac',
          600: '#2a5d8a',
          700: '#234b6f',
          800: '#1d3d5b',
          900: '#1a344d',
        },
        navy: {
          DEFAULT: '#293F55',
          dark: '#1e2f40',
          light: '#3a5570',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};

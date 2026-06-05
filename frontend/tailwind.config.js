/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B1120',
          card: '#111827',
          border: '#1F2937',
          hover: '#1a2332',
        },
        emerald: {
          primary: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
        gold: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

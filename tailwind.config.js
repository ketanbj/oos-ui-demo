/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          bg: '#070911',
          panel: '#0d1020',
          accent: '#6de3ff',
          glow: '#7c5cf4',
          danger: '#ff7b7b',
          warning: '#ffc876',
          success: '#8ae5c1',
        },
      },
      boxShadow: {
        glow: '0 0 25px rgba(109, 227, 255, 0.25)',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

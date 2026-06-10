import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Editorial palette drawn from the reference: coral, sky, paper, ink
        coral: {
          DEFAULT: '#F2938C',
          soft: '#F8C2BC',
          tint: '#FCE3E0',
          deep: '#D9655E',
        },
        sky: {
          DEFAULT: '#A6D2DE',
          soft: '#CDE8EE',
          tint: '#E6F3F6',
          deep: '#5E97A6',
        },
        ink: {
          DEFAULT: '#16273B',
          soft: '#48586A',
          faint: '#8A97A5',
        },
        paper: {
          DEFAULT: '#FBFAF6',
          pure: '#FFFFFF',
          warm: '#F4F1EA',
        },
        // Semantic status colors tuned to the palette
        good: '#3E9A87',
        average: '#D79A3C',
        poor: '#D9655E',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        editorial: '0 24px 60px -28px rgba(22, 39, 59, 0.28)',
        card: '0 12px 32px -20px rgba(22, 39, 59, 0.22)',
        lift: '0 2px 0 rgba(22, 39, 59, 0.04), 0 18px 40px -24px rgba(22, 39, 59, 0.30)',
      },
      keyframes: {
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'draw-ring': {
          '0%': { strokeDashoffset: 'var(--ring-circ)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.8s ease both',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

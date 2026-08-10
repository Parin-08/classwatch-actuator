/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020818',
          900: '#030d22',
          800: '#071330',
          700: '#0c1d45',
          600: '#112558',
        },
        glow: {
          blue:  '#3b82f6',
          amber: '#f59e0b',
          red:   '#ef4444',
          green: '#22c55e',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow':   'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-fast':   'pulse 0.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-blue':    'glow-blue 3s ease-in-out infinite',
        'glow-amber':   'glow-amber 2s ease-in-out infinite',
        'glow-red':     'glow-red 0.8s ease-in-out infinite',
        'slide-in':     'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':      'fadeIn 0.4s ease',
        'float':        'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-blue': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(59,130,246,0.4)' },
          '50%':      { boxShadow: '0 0 20px 6px rgba(59,130,246,0.7)' },
        },
        'glow-amber': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(245,158,11,0.4)' },
          '50%':      { boxShadow: '0 0 22px 8px rgba(245,158,11,0.75)' },
        },
        'glow-red': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(239,68,68,0.4)' },
          '50%':      { boxShadow: '0 0 28px 10px rgba(239,68,68,0.9)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: 0 },
          to:   { transform: 'translateX(0)',    opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}

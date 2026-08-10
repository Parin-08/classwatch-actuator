/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        navy: {
          950: '#020818',
          900: '#030d22',
          800: '#0a1428',
          700: '#0d1a33',
        },
      },
      animation: {
        'glow-blue': 'glow-blue-pulse 3s ease-in-out infinite',
        'glow-amber': 'glow-amber-pulse 2s ease-in-out infinite',
        'glow-red': 'glow-red-pulse 0.8s ease-in-out infinite',
        'orb-1': 'orb-float-1 25s ease-in-out infinite',
        'orb-2': 'orb-float-2 30s ease-in-out infinite',
        'orb-3': 'orb-float-3 20s ease-in-out infinite',
        'live-ping': 'live-ping 1.4s ease-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        'glow-blue-pulse': {
          '0%, 100%': { boxShadow: '0 0 6px 1px rgba(59,130,246,0.35), inset 0 0 12px rgba(59,130,246,0.08)' },
          '50%': { boxShadow: '0 0 18px 5px rgba(59,130,246,0.6), inset 0 0 20px rgba(59,130,246,0.15)' },
        },
        'glow-amber-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(245,158,11,0.4), inset 0 0 14px rgba(245,158,11,0.08)' },
          '50%': { boxShadow: '0 0 24px 8px rgba(245,158,11,0.75), inset 0 0 24px rgba(245,158,11,0.18)' },
        },
        'glow-red-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px 3px rgba(239,68,68,0.5), inset 0 0 16px rgba(239,68,68,0.12)' },
          '50%': { boxShadow: '0 0 32px 12px rgba(239,68,68,0.95), inset 0 0 28px rgba(239,68,68,0.25)' },
        },
        'orb-float-1': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -25px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.97)' },
        },
        'orb-float-2': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '40%': { transform: 'translate(-40px, 30px) scale(1.08)' },
          '75%': { transform: 'translate(25px, -18px) scale(0.95)' },
        },
        'orb-float-3': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(20px, 35px) scale(1.04)' },
        },
        'live-ping': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% center' },
          to: { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}

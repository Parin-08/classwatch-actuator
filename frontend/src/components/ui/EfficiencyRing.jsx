/**
 * EfficiencyRing.jsx
 *
 * SVG circular progress arc that displays an efficiency score (0-100).
 * Color interpolates: green (≥80) → amber (≥60) → red (<60).
 *
 * Props:
 *   score    — number 0-100
 *   size     — SVG diameter in px (default 80)
 *   strokeW  — stroke width (default 6)
 */

import { motion } from 'framer-motion'

function scoreToColor(score) {
  if (score >= 80) return '#34d399' // emerald-400
  if (score >= 60) return '#fbbf24' // amber-400
  return '#f87171'                  // red-400
}

export default function EfficiencyRing({ score, size = 80, strokeW = 6 }) {
  const radius = (size - strokeW) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100)
  const color = scoreToColor(score)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeW}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>

      {/* Centre label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: size * 0.26,
            color,
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: size * 0.13, color: 'rgba(148,163,184,0.7)', marginTop: 1 }}>
          score
        </span>
      </div>
    </div>
  )
}

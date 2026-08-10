const STATUS_COLORS = {
  normal:  { stroke: '#3b82f6', text: '#93c5fd' },
  wasting: { stroke: '#f59e0b', text: '#fcd34d' },
  flagged: { stroke: '#ef4444', text: '#fca5a5' },
}

const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function EfficiencyRing({ score, status }) {
  const { stroke, text } = STATUS_COLORS[status] || STATUS_COLORS.normal
  const progress = ((score ?? 0) / 100) * CIRCUMFERENCE
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'

  return (
    <div className="flex flex-col items-center justify-center corner-cut-sm py-3"
         style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        {/* Background track */}
        <circle
          cx="44" cy="44" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        {/* Progress arc */}
        <circle
          cx="44" cy="44" r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeDasharray={`${progress} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{
            filter: `drop-shadow(0 0 6px ${stroke}80)`,
            transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        {/* Inner score */}
        <text x="44" y="40" textAnchor="middle" fill={text}
              fontSize="18" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          {score}
        </text>
        <text x="44" y="54" textAnchor="middle" fill="#475569"
              fontSize="7" fontFamily="Inter, sans-serif" letterSpacing="1">
          EFFICIENCY
        </text>
      </svg>
      <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: stroke }}>{label}</span>
    </div>
  )
}

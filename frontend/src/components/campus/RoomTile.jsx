import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Zap, Lightbulb, Fan, Snowflake, Monitor } from 'lucide-react'

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CONFIG = {
  normal: {
    tileClass:     'tile-normal',
    borderColor:   '#3b82f6',
    gradientFrom:  'rgba(59,130,246,0.16)',
    gradientTo:    'rgba(29,78,216,0.04)',
    badgeColor:    '#3b82f6',
    badgeText:     'NORMAL',
    textColor:     '#93c5fd',
    burstColor:    'rgba(59,130,246,0.25)',
  },
  wasting: {
    tileClass:     'tile-wasting',
    borderColor:   '#f59e0b',
    gradientFrom:  'rgba(245,158,11,0.18)',
    gradientTo:    'rgba(180,83,9,0.04)',
    badgeColor:    '#f59e0b',
    badgeText:     'WASTING',
    textColor:     '#fcd34d',
    burstColor:    'rgba(245,158,11,0.3)',
  },
  flagged: {
    tileClass:     'tile-flagged',
    borderColor:   '#ef4444',
    gradientFrom:  'rgba(239,68,68,0.22)',
    gradientTo:    'rgba(185,28,28,0.04)',
    badgeColor:    '#ef4444',
    badgeText:     'FLAGGED',
    textColor:     '#fca5a5',
    burstColor:    'rgba(239,68,68,0.35)',
  },
}

/* ─── Device icon map ────────────────────────────────────────── */
const DEVICES = [
  { key: 'light',     Icon: Lightbulb, label: 'Light',  onColor: '#fbbf24' },
  { key: 'fan',       Icon: Fan,       label: 'Fan',    onColor: '#60a5fa' },
  { key: 'ac',        Icon: Snowflake, label: 'AC',     onColor: '#34d399' },
  { key: 'projector', Icon: Monitor,   label: 'Proj',   onColor: '#a78bfa' },
]

/* ─── Inline SVG Sparkline ───────────────────────────────────── */
function Sparkline({ history, status, width = 72, height = 20 }) {
  const points = history.slice(-10)
  if (points.length < 2) return null

  const vals = points.map(p => p.watts)
  const min  = Math.min(...vals)
  const max  = Math.max(...vals)
  const range = max - min || 1

  const pts = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width
      const y = height - ((p.watts - min) / range) * (height - 2) - 1
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const color =
    status === 'flagged' ? '#ef4444'
    : status === 'wasting' ? '#f59e0b'
    : '#3b82f6'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Gradient fill under sparkline */}
      <defs>
        <linearGradient id={`spark-fill-${status}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#spark-fill-${status})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  )
}

/* ─── Watt bar ───────────────────────────────────────────────── */
function WattsBar({ watts, status }) {
  const pct   = Math.min(100, (watts / 2500) * 100)
  const color = status === 'flagged' ? '#ef4444' : status === 'wasting' ? '#f59e0b' : '#3b82f6'
  return (
    <div
      className="h-1 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

/* ─── Device icon chips (tile version) ──────────────────────── */
function DeviceChips({ devices }) {
  return (
    <div className="flex gap-1.5">
      {DEVICES.map(({ key, Icon, label, onColor }) => {
        const isOn = devices?.[key] ?? false
        return (
          <div
            key={key}
            title={`${label}: ${isOn ? 'ON' : 'OFF'}`}
            className="flex items-center justify-center rounded-md"
            style={{
              width: 24,
              height: 24,
              background:  isOn ? `${onColor}20` : 'rgba(255,255,255,0.03)',
              border:      isOn ? `1px solid ${onColor}50` : '1px solid rgba(255,255,255,0.07)',
              boxShadow:   isOn ? `0 0 6px ${onColor}40` : 'none',
              transition:  'all 0.3s ease',
            }}
          >
            <Icon
              size={12}
              strokeWidth={1.5}
              color={isOn ? onColor : '#334155'}
              style={{
                filter:     isOn ? `drop-shadow(0 0 3px ${onColor}90)` : 'none',
                transition: 'all 0.3s ease',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ─── Efficiency mini ring ───────────────────────────────────── */
function EfficiencyMini({ score, color }) {
  const R = 11
  const C = 2 * Math.PI * R
  const progress = (score / 100) * C
  return (
    <div className="flex flex-col items-center" title={`Efficiency: ${score}%`}>
      <svg width={28} height={28} viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
        <circle
          cx="14" cy="14" r={R}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${progress} ${C}`}
          strokeLinecap="round"
          transform="rotate(-90 14 14)"
          opacity="0.8"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text
          x="14" y="15"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="6"
          fontWeight="700"
          fontFamily="'JetBrains Mono', monospace"
        >
          {score}
        </text>
      </svg>
    </div>
  )
}

/* ─── RoomTile ───────────────────────────────────────────────── */
export default function RoomTile({ room, isSelected, onClick }) {
  const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.normal

  // Status-change burst tracking
  const prevStatusRef = useRef(room.status)
  const [showBurst, setShowBurst] = useState(false)

  useEffect(() => {
    if (prevStatusRef.current !== room.status) {
      prevStatusRef.current = room.status
      setShowBurst(true)
      const t = setTimeout(() => setShowBurst(false), 900)
      return () => clearTimeout(t)
    }
  }, [room.status])

  // Smooth status-based background/border transition
  const transitionStyle = {
    background:  `linear-gradient(145deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
    border:      `1px solid ${cfg.borderColor}40`,
    transition:  'background 0.8s ease, border-color 0.8s ease, filter 0.2s ease, transform 0.2s cubic-bezier(0.4,0,0.2,1)',
  }

  return (
    <button
      id={`tile-${room.room_id}`}
      onClick={onClick}
      className={[
        'relative w-full text-left corner-cut p-4 cursor-pointer',
        cfg.tileClass,
        isSelected ? 'ring-2 ring-white/25 scale-[1.03]' : '',
      ].join(' ')}
      style={{ ...transitionStyle, minHeight: '200px' }}
      aria-label={`${room.name} — ${room.status} — ${room.power_watts}W`}
    >
      {/* ── Ripple rings (flagged only) ── */}
      {room.status === 'flagged' && (
        <>
          <div className="ripple-ring" />
          <div className="ripple-ring ripple-ring-2" />
        </>
      )}

      {/* ── Status-change burst ── */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            key="burst"
            className="absolute inset-0 corner-cut pointer-events-none"
            style={{ background: `radial-gradient(circle at center, ${cfg.burstColor} 0%, transparent 70%)` }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* ── Selected accent ring ── */}
      {isSelected && (
        <div
          className="absolute inset-0 corner-cut pointer-events-none"
          style={{ border: `2px solid ${cfg.borderColor}`, opacity: 0.6 }}
        />
      )}

      {/* ── Row 1: Room ID + status badge ── */}
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-xs font-medium text-slate-500">{room.room_id}</span>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{
            background: `${cfg.badgeColor}20`,
            color:       cfg.badgeColor,
            border:      `1px solid ${cfg.badgeColor}40`,
          }}
        >
          {cfg.badgeText}
        </span>
      </div>

      {/* ── Row 2: Room name ── */}
      <h3
        className="font-semibold text-sm text-slate-100 leading-tight mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {room.name}
      </h3>

      {/* ── Row 3: Power + sparkline side-by-side ── */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Zap size={11} strokeWidth={1.5} style={{ color: cfg.badgeColor }} />
          <span
            className="instrument-num text-sm"
            style={{ color: cfg.textColor }}
          >
            {room.power_watts.toLocaleString()} W
          </span>
        </div>
        {/* Sparkline (last 10 points) */}
        <div style={{ opacity: 0.85 }}>
          <Sparkline history={room.history || []} status={room.status} />
        </div>
      </div>

      {/* ── Row 4: Watts bar ── */}
      <div className="mb-3">
        <WattsBar watts={room.power_watts} status={room.status} />
      </div>

      {/* ── Row 5: Occupancy count ── */}
      <div className="flex items-center gap-1.5 mb-2">
        <Users size={11} strokeWidth={1.5} className="text-slate-600" />
        {room.occupancy === 1 ? (
          <span className="text-xs text-slate-300 font-medium">{room.occupancy_count} people</span>
        ) : (
          <span className="text-xs text-slate-600">Empty</span>
        )}
      </div>

      {/* ── Row 6: Device icon chips + efficiency ring ── */}
      <div className="flex items-center justify-between">
        <DeviceChips devices={room.devices} />
        <EfficiencyMini score={room.efficiency_score} color={cfg.badgeColor} />
      </div>
    </button>
  )
}

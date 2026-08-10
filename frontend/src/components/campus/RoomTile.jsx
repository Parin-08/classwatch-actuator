/**
 * RoomTile.jsx
 *
 * A single clickable campus map tile representing one room.
 *
 * Visual design:
 *  - Status-driven glow class: tile-normal / tile-wasting / tile-flagged
 *  - Flagged tiles get two animated ripple rings for urgency
 *  - Device icons row (light, fan, AC, projector)
 *  - Efficiency score badge + live power readout
 *  - SVG corner-cut shape for premium feel
 *  - Selected state: bright ring + scale up
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Users, Wind, Sun, Monitor, Flame } from 'lucide-react'

const STATUS_COLORS = {
  normal:  { border: 'rgba(59,130,246,0.45)',  bg: 'rgba(59,130,246,0.06)',  accent: '#60a5fa' },
  wasting: { border: 'rgba(245,158,11,0.55)',  bg: 'rgba(245,158,11,0.07)',  accent: '#fbbf24' },
  flagged: { border: 'rgba(239,68,68,0.6)',    bg: 'rgba(239,68,68,0.08)',   accent: '#f87171' },
}

function DeviceIcon({ active, title, icon: Icon }) {
  return (
    <span
      title={title}
      style={{
        color: active ? '#93c5fd' : 'rgba(100,116,139,0.4)',
        transition: 'color 0.3s',
      }}
    >
      <Icon size={11} strokeWidth={active ? 2 : 1.5} />
    </span>
  )
}

function formatWatts(w) {
  if (w >= 1000) return `${(w / 1000).toFixed(1)} kW`
  return `${w} W`
}

export default function RoomTile({ room, isSelected, onClick }) {
  const { status, efficiency_score: score, power_watts, devices, name, occupancy_count, occupancy } = room
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.normal
  const isFlagged = status === 'flagged'

  return (
    <motion.button
      id={`tile-${room.room_id}`}
      role="button"
      aria-label={`${name} — ${status} — ${formatWatts(power_watts)}`}
      aria-pressed={isSelected}
      onClick={onClick}
      className={`tile-${status} relative w-full text-left outline-none corner-cut`}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${isSelected ? cfg.accent : cfg.border}`,
        borderRadius: '10px',
        padding: '14px 14px 12px',
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: isSelected
          ? `0 0 0 2px ${cfg.accent}, 0 8px 30px -4px ${cfg.border}`
          : undefined,
      }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Ripple rings for flagged rooms */}
      {isFlagged && (
        <>
          <div className="ripple-ring" style={{ borderColor: 'rgba(239,68,68,0.6)' }} />
          <div className="ripple-ring ripple-ring-2" style={{ borderColor: 'rgba(239,68,68,0.4)' }} />
        </>
      )}

      {/* ── Top row: room ID + power ── */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: cfg.accent }}
          >
            {room.room_id}
          </span>
          <div className="text-[13px] font-semibold text-slate-200 leading-tight mt-0.5">
            {name}
          </div>
        </div>

        {/* Status dot */}
        <span
          className="mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: cfg.accent,
            boxShadow: `0 0 6px 1px ${cfg.accent}`,
          }}
        />
      </div>

      {/* ── Power readout ── */}
      <div className="flex items-center gap-1 mb-3">
        <Zap size={11} strokeWidth={2} style={{ color: cfg.accent }} />
        <span
          className="font-mono text-sm font-bold"
          style={{
            color: cfg.accent,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.03em',
          }}
        >
          {formatWatts(power_watts)}
        </span>
      </div>

      {/* ── Occupancy bar ── */}
      <div className="flex items-center gap-2 mb-3">
        <Users size={10} strokeWidth={1.5} className="text-slate-500 flex-shrink-0" />
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: occupancy ? '#34d399' : 'rgba(100,116,139,0.3)' }}
            initial={{ width: 0 }}
            animate={{ width: occupancy ? '100%' : '0%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[10px] text-slate-500 font-mono">{occupancy_count}</span>
      </div>

      {/* ── Device icons ── */}
      <div className="flex items-center gap-2 mb-3">
        <DeviceIcon active={devices.light}    title="Light"     icon={Sun}     />
        <DeviceIcon active={devices.fan}      title="Fan"       icon={Wind}    />
        <DeviceIcon active={devices.ac}       title="AC"        icon={Flame}   />
        <DeviceIcon active={devices.projector} title="Projector" icon={Monitor} />
      </div>

      {/* ── Efficiency score bar ── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">Efficiency</span>
          <span
            className="text-[10px] font-bold font-mono"
            style={{
              color: score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171',
            }}
          >
            {score}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                score >= 80
                  ? 'linear-gradient(90deg,#34d399,#059669)'
                  : score >= 60
                  ? 'linear-gradient(90deg,#fbbf24,#d97706)'
                  : 'linear-gradient(90deg,#f87171,#dc2626)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          />
        </div>
      </div>
    </motion.button>
  )
}

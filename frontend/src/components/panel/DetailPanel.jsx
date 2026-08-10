/**
 * DetailPanel.jsx
 *
 * Slide-in side panel that appears when a room tile is clicked.
 * Shows:
 *  - Room header with status badge + live power
 *  - Recharts AreaChart of power_watts over time (30 data points, live ticks)
 *  - Occupancy sub-chart on the same axes
 *  - Device status grid (light / fan / AC / projector)
 *  - Efficiency ring + score
 *  - Class schedule (last_class_end → next_class_start)
 *  - Close button
 *
 * Animation: framer-motion AnimatePresence with slide+fade from right.
 */

import { AnimatePresence, motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  X, Zap, Users, Sun, Wind, Monitor, Flame,
  Clock, CalendarClock, ArrowRight,
} from 'lucide-react'
import EfficiencyRing from '../ui/EfficiencyRing'
import { useRoomHistory } from '../../hooks/useRoomHistory'

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS = {
  normal:  { label: 'Normal',  color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  wasting: { label: 'Wasting', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  flagged: { label: 'Critical',color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
}

// ─── Custom tooltip ────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const time = label ? new Date(label).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div
      style={{
        background: 'rgba(10,20,45,0.95)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <p className="text-slate-400 mb-1 text-[10px]">{time}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          {p.name === 'watts' ? `${p.value} W` : `${p.value} ppl`}
        </p>
      ))}
    </div>
  )
}

// ─── Device badge ──────────────────────────────────────────────────────────
function DeviceBadge({ label, active, icon: Icon }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2"
      style={{
        background: active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
        border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.3s',
      }}
    >
      <Icon
        size={16}
        strokeWidth={active ? 2 : 1.5}
        style={{ color: active ? '#60a5fa' : 'rgba(100,116,139,0.4)' }}
      />
      <span
        className="text-[10px] font-medium uppercase tracking-wide"
        style={{ color: active ? '#93c5fd' : 'rgba(100,116,139,0.5)' }}
      >
        {label}
      </span>
      <span
        className="text-[9px] font-bold"
        style={{ color: active ? '#34d399' : '#475569' }}
      >
        {active ? 'ON' : 'OFF'}
      </span>
    </div>
  )
}

// ─── Time formatter ────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function fmtWatts(w) {
  return w >= 1000 ? `${(w / 1000).toFixed(2)} kW` : `${w} W`
}

// ─── Main component ─────────────────────────────────────────────────────────
export default function DetailPanel({ room, onClose }) {
  const { history, loading: histLoading } = useRoomHistory(room)
  const cfg = STATUS[room?.status] || STATUS.normal

  // Format history for recharts (compact time label)
  const chartData = history.map((h) => ({
    ...h,
    label: new Date(h.t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  }))

  return (
    <AnimatePresence>
      {room && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            id="detail-panel"
            role="dialog"
            aria-label={`Detail panel for ${room.name}`}
            className="fixed right-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden"
            style={{
              width: 'min(440px, 92vw)',
              background: 'rgba(5,12,30,0.97)',
              borderLeft: `1px solid ${cfg.border}`,
              backdropFilter: 'blur(24px)',
              boxShadow: `-8px 0 60px -10px ${cfg.color}30`,
            }}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-start justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: `1px solid ${cfg.border}` }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-slate-600">{room.building}</span>
                </div>
                <h2
                  className="text-lg font-bold text-slate-100 leading-tight"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}
                >
                  {room.name}
                  <span className="ml-2 text-sm font-normal" style={{ color: cfg.color }}>
                    · {room.room_id}
                  </span>
                </h2>

                {/* Live power */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Zap size={12} strokeWidth={2} style={{ color: cfg.color }} />
                  <span
                    className="text-xl font-bold"
                    style={{
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '-0.05em',
                      color: cfg.color,
                    }}
                  >
                    {fmtWatts(room.power_watts)}
                  </span>
                  <span className="text-xs text-slate-600">live</span>
                </div>
              </div>

              {/* Close button */}
              <button
                id="detail-panel-close"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                aria-label="Close detail panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 flex flex-col gap-5">

              {/* ── Power chart ── */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">
                  Power Draw — Last 2.5 Hours
                </p>
                <div style={{ height: 160 }}>
                  {histLoading ? (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                      Loading telemetry…
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradPower" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={cfg.color} stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="gradOcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: '#475569' }}
                          tickLine={false}
                          axisLine={false}
                          interval={Math.floor(chartData.length / 5)}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: '#475569' }}
                          tickLine={false}
                          axisLine={false}
                          width={42}
                          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="watts"
                          stroke={cfg.color}
                          strokeWidth={2}
                          fill="url(#gradPower)"
                          dot={false}
                          activeDot={{ r: 3, fill: cfg.color, strokeWidth: 0 }}
                          isAnimationActive={true}
                          animationDuration={600}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── Occupancy chart ── */}
              {chartData.some((d) => d.occupancy > 0) && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">
                    Occupancy Count
                  </p>
                  <div style={{ height: 100 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradOcc2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                        <XAxis dataKey="label" hide />
                        <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} width={32} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area
                          type="stepAfter"
                          dataKey="occupancy"
                          stroke="#34d399"
                          strokeWidth={1.5}
                          fill="url(#gradOcc2)"
                          dot={false}
                          isAnimationActive={true}
                          animationDuration={600}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── Efficiency + Occupancy stat row ── */}
              <div className="flex items-center gap-4">
                <EfficiencyRing score={room.efficiency_score} size={88} strokeW={7} />
                <div className="flex-1">
                  <div
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={12} className="text-slate-500" />
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Occupancy</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-2xl font-bold"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: room.occupancy ? '#34d399' : '#475569',
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {room.occupancy_count}
                      </span>
                      <span className="text-xs text-slate-600">people</span>
                    </div>
                    <div
                      className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-block"
                      style={{
                        background: room.occupancy ? 'rgba(52,211,153,0.1)' : 'rgba(100,116,139,0.1)',
                        color: room.occupancy ? '#34d399' : '#64748b',
                      }}
                    >
                      {room.occupancy ? 'Occupied' : 'Empty'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Device status grid ── */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">
                  Device Status
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <DeviceBadge label="Light"     active={room.devices.light}     icon={Sun}     />
                  <DeviceBadge label="Fan"        active={room.devices.fan}       icon={Wind}    />
                  <DeviceBadge label="AC"         active={room.devices.ac}        icon={Flame}   />
                  <DeviceBadge label="Projector"  active={room.devices.projector} icon={Monitor} />
                </div>
              </div>

              {/* ── Class schedule ── */}
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold flex items-center gap-1.5">
                  <CalendarClock size={11} />
                  Class Schedule
                </p>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Last Ended</p>
                    <p className="text-sm font-bold text-slate-300 font-mono">
                      {fmtTime(room.last_class_end)}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-slate-700 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider">Next Class</p>
                    <p className="text-sm font-bold text-slate-300 font-mono">
                      {fmtTime(room.next_class_start)}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Last updated ── */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
                <Clock size={10} />
                Updated {new Date(room.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

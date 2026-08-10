import React, { useEffect, useState } from 'react'
import { Zap, Wifi, WifiOff, Activity, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedCounter from '../ui/AnimatedCounter'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export default function Header({
  totalPower, flaggedCount, wastingCount, avgEfficiency, occupiedCount, roomCount,
}) {
  return (
    <header
      className="relative z-20 flex flex-col border-b border-blue-950/60"
      style={{ background: 'rgba(2,8,24,0.97)', backdropFilter: 'blur(20px)' }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-3">

        {/* Logo */}
        <motion.div
          className="flex flex-col justify-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-1">
            {/* Custom Abstract SVG Glyph */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M2 12h4l3-7 4 14 3-7h6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.4" />
            </svg>
            <h1
              className="text-xl font-bold text-slate-100 leading-none"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.06em' }}
            >
              CLASS<span className="text-blue-500">WATCH</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-blue-500/50" />
            <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none font-semibold">
              Digital Twin Telemetry
            </p>
          </div>
        </motion.div>

        {/* Live / Mock badge */}
        <motion.div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: USE_MOCK ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
            border: USE_MOCK ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(34,197,94,0.25)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {USE_MOCK ? (
            <>
              <WifiOff size={12} strokeWidth={1.5} className="text-amber-400" />
              <span className="text-amber-400 font-semibold">MOCK MODE</span>
            </>
          ) : (
            <>
              <span className="live-dot w-2 h-2 rounded-full bg-green-400 inline-block" />
              <Wifi size={12} strokeWidth={1.5} className="text-green-400 ml-1" />
              <span className="text-green-400 font-semibold">LIVE</span>
            </>
          )}
        </motion.div>

        {/* Live clock */}
        <LiveClock />
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-5 divide-x divide-blue-950/40 border-t border-blue-950/40">
        <StatPill
          label="Total Power"
          icon={<Activity size={12} strokeWidth={1.5} />}
          color="blue"
          delay={0.1}
        >
          {/* Animated kW counter — smoothly interpolates on each 5s jitter */}
          <AnimatedCounter
            value={parseFloat((totalPower / 1000).toFixed(2))}
            decimals={2}
            suffix=" kW"
            className="stat-number text-base text-blue-300"
          />
        </StatPill>

        <StatPill
          label="Rooms Online"
          icon={<Zap size={12} strokeWidth={1.5} />}
          color="purple"
          delay={0.15}
        >
          <span className="stat-number text-base text-purple-300">{roomCount} rooms</span>
        </StatPill>

        <StatPill
          label="Occupied"
          icon={null}
          color="green"
          delay={0.2}
        >
          <span className="stat-number text-base text-emerald-300">
            {occupiedCount} / {roomCount}
          </span>
        </StatPill>

        <StatPill
          label="Flagged"
          icon={<AlertTriangle size={12} strokeWidth={1.5} />}
          color="red"
          delay={0.25}
          pulse={flaggedCount > 0}
        >
          <AnimatedCounter
            value={flaggedCount}
            decimals={0}
            className={`stat-number text-base ${flaggedCount > 0 ? 'text-red-400' : 'text-slate-500'}`}
          />
        </StatPill>

        <StatPill
          label="Avg Efficiency"
          icon={null}
          color={avgEfficiency >= 80 ? 'green' : avgEfficiency >= 60 ? 'amber' : 'red'}
          delay={0.3}
        >
          <AnimatedCounter
            value={avgEfficiency}
            decimals={0}
            suffix="%"
            className={`stat-number text-base ${avgEfficiency >= 80 ? 'text-emerald-300'
                : avgEfficiency >= 60 ? 'text-amber-300'
                  : 'text-red-400'
              }`}
          />
        </StatPill>
      </div>
    </header>
  )
}

/* ─── StatPill ───────────────────────────────────────────────── */
function StatPill({ label, icon, color, delay, pulse = false, children }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-2 px-4 gap-0.5"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className={`flex items-center gap-1.5 ${pulse ? 'animate-pulse' : ''}`}>
        {icon && <span className={
          color === 'red' ? 'text-red-400' :
            color === 'amber' ? 'text-amber-400' :
              color === 'green' ? 'text-emerald-400' :
                color === 'purple' ? 'text-purple-400' : 'text-blue-400'
        }>{icon}</span>}
        {children}
      </div>
      <span className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</span>
    </motion.div>
  )
}

/* ─── LiveClock ──────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-right">
      <div
        className="font-mono text-sm font-medium text-slate-300"
        style={{ letterSpacing: '0.04em' }}
      >
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-[10px] text-slate-600">
        {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}

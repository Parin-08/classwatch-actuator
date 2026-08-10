import { motion } from 'framer-motion'

export default function StatCard({ label, value, sub, icon, color = 'blue', delay = 0, pulse = false }) {
  const colors = {
    blue:   { text: 'text-blue-400',   glow: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.2)'  },
    amber:  { text: 'text-amber-400',  glow: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.2)'  },
    red:    { text: 'text-red-400',    glow: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.2)'   },
    green:  { text: 'text-emerald-400',glow: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.2)'  },
    purple: { text: 'text-purple-400', glow: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.2)'  },
  }
  const c = colors[color] || colors.blue

  return (
    <motion.div
      className="corner-cut p-4 flex flex-col gap-2"
      style={{
        background: `linear-gradient(145deg, ${c.glow}, rgba(7,19,48,0.4))`,
        border: `1px solid ${c.border}`,
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <span className={`${c.text} ${pulse ? 'animate-pulse' : ''}`}>{icon}</span>}
      </div>
      <div className={`text-2xl font-bold font-mono ${c.text} ${pulse ? 'animate-pulse' : ''}`}>{value}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </motion.div>
  )
}

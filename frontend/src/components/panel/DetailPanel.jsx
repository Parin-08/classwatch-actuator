import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Users, Clock, ChevronRight } from 'lucide-react'
import PowerChart from './PowerChart'
import DeviceBadges from './DeviceBadges'
import EfficiencyRing from './EfficiencyRing'

const STATUS_COLOR = {
  normal:  { text: 'text-blue-400',   border: 'border-blue-500/30',  badge: 'bg-blue-500/10 text-blue-300'   },
  wasting: { text: 'text-amber-400',  border: 'border-amber-500/30', badge: 'bg-amber-500/10 text-amber-300' },
  flagged: { text: 'text-red-400',    border: 'border-red-500/30',   badge: 'bg-red-500/10 text-red-300'     },
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function DetailPanel({ room, onClose }) {
  const sc = STATUS_COLOR[room?.status] || STATUS_COLOR.normal

  return (
    <AnimatePresence>
      {room && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="detail-panel"
            className="fixed right-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden"
            style={{
              width: 'min(420px, 100vw)',
              background: 'rgba(3,10,28,0.97)',
              backdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(59,130,246,0.15)',
            }}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{room.room_id}</span>
                  <ChevronRight size={12} className="text-slate-700" />
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${sc.badge}`}>
                    {room.status}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-0.5">{room.name}</h2>
                <p className="text-xs text-slate-500">{room.building}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all btn-hover"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-5">

              {/* Key metrics row */}
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Power"
                  value={`${room.power_watts.toLocaleString()}`}
                  unit="W"
                  icon={<Zap size={14} />}
                  status={room.status}
                />
                <MetricCard
                  label="Occupants"
                  value={room.occupancy === 1 ? room.occupancy_count : 0}
                  unit="ppl"
                  icon={<Users size={14} />}
                  status={room.status}
                />
                <EfficiencyRing score={room.efficiency_score} status={room.status} />
              </div>

              {/* Power chart */}
              <div>
                <SectionLabel>Power Draw — Last 20 min</SectionLabel>
                <PowerChart history={room.history || []} status={room.status} />
              </div>

              {/* Devices */}
              <div>
                <SectionLabel>Active Devices</SectionLabel>
                <DeviceBadges devices={room.devices} />
              </div>

              {/* Schedule */}
              <div>
                <SectionLabel>Schedule</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <ScheduleCard label="Last Class Ended" time={formatTime(room.last_class_end)} />
                  <ScheduleCard label="Next Class Starts" time={formatTime(room.next_class_start)} accent />
                </div>
              </div>

              {/* Updated at */}
              <p className="text-center text-[10px] text-slate-700 pb-2">
                Last updated · {new Date(room.updated_at).toLocaleTimeString('en-IN')}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function MetricCard({ label, value, unit, icon, status }) {
  const color = status === 'flagged' ? '#ef4444' : status === 'wasting' ? '#f59e0b' : '#3b82f6'
  return (
    <div className="corner-cut-sm p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="font-mono text-xl font-bold text-slate-100">{value}</div>
      <div className="text-[9px] text-slate-600 uppercase tracking-wider">{unit} · {label}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <h3 className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-2 flex items-center gap-2">
      <span className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      {children}
      <span className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </h3>
  )
}

function ScheduleCard({ label, time, accent }) {
  return (
    <div
      className="corner-cut-sm p-3 text-center"
      style={{
        background: accent ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.02)',
        border: accent ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <Clock size={12} className={`mx-auto mb-1 ${accent ? 'text-blue-400' : 'text-slate-600'}`} />
      <div className={`font-mono text-sm font-bold ${accent ? 'text-blue-300' : 'text-slate-300'}`}>{time}</div>
      <div className="text-[9px] text-slate-600 mt-0.5">{label}</div>
    </div>
  )
}

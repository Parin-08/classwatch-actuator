import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'

const severityConfig = {
  critical: {
    icon: <AlertCircle size={14} />,
    color: 'text-red-400',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    dot: 'bg-red-500',
    label: 'Critical',
  },
  warning: {
    icon: <AlertTriangle size={14} />,
    color: 'text-amber-400',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    dot: 'bg-amber-500',
    label: 'Warning',
  },
  info: {
    icon: <Info size={14} />,
    color: 'text-blue-400',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    dot: 'bg-blue-500',
    label: 'Info',
  },
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return `${Math.round(diff)}s ago`
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  return `${Math.round(diff / 3600)}h ago`
}

export default function Sidebar({ alerts, onSelectRoom }) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  return (
    <aside
      className="flex flex-col h-full border-l border-blue-950/50 overflow-hidden"
      style={{ background: 'rgba(3,13,34,0.9)', backdropFilter: 'blur(12px)', width: '280px', minWidth: '280px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-950/50">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-200">Alert Feed</span>
        </div>
        {criticalCount > 0 && (
          <motion.span
            className="shimmer-badge text-red-300 text-xs font-bold px-2 py-0.5 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {criticalCount} critical
          </motion.span>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-3 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {alerts.length === 0 && (
            <div className="text-center text-slate-600 text-sm mt-8">
              <Bell size={28} className="mx-auto mb-2 opacity-30" />
              No active alerts
            </div>
          )}
          {alerts.map((alert, i) => {
            const cfg = severityConfig[alert.severity] || severityConfig.info
            return (
              <motion.button
                key={alert.id}
                className="w-full text-left rounded-3xl p-3 transition-all btn-hover"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelectRoom && onSelectRoom(alert.room_id)}
                title={`Jump to ${alert.room_id}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`${cfg.color} mt-0.5 shrink-0`}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                        {cfg.label} · {alert.room_id}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-1 shrink-0">{timeAgo(alert.ts)}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">{alert.message}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-blue-950/50 text-[10px] text-slate-700 text-center">
        Click an alert to inspect the room
      </div>
    </aside>
  )
}

const STATUS_CONFIG = {
  normal:  { bg: 'bg-blue-500/10',  text: 'text-blue-300',  border: 'border-blue-500/25',  label: 'Normal'  },
  wasting: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/25', label: 'Wasting' },
  flagged: { bg: 'bg-red-500/10',   text: 'text-red-300',   border: 'border-red-500/25',   label: 'Flagged' },
}

export default function StatusBadge({ status, className = '' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.normal
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider
        px-2 py-0.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${
        status === 'flagged' ? 'bg-red-400 animate-pulse' :
        status === 'wasting' ? 'bg-amber-400' : 'bg-blue-400'
      }`} />
      {cfg.label}
    </span>
  )
}

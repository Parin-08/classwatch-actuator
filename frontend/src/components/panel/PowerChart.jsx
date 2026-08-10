import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useMemo } from 'react'

const STATUS_COLORS = {
  normal:  { stroke: '#3b82f6', fill: '#1d4ed8' },
  wasting: { stroke: '#f59e0b', fill: '#b45309' },
  flagged: { stroke: '#ef4444', fill: '#b91c1c' },
}

function formatTimeTick(iso) {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const { watts, occupancy } = payload[0]?.payload || {}
  return (
    <div
      className="corner-cut-sm px-3 py-2 text-xs"
      style={{
        background: 'rgba(3,10,28,0.95)',
        border: '1px solid rgba(59,130,246,0.25)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="text-slate-400 mb-1">{formatTimeTick(label)}</p>
      <p className="font-mono font-bold text-slate-100">{watts?.toLocaleString()} W</p>
      {occupancy !== undefined && (
        <p className="text-slate-500 mt-0.5">{occupancy} occupants</p>
      )}
    </div>
  )
}

export default function PowerChart({ history, status }) {
  const { stroke, fill } = STATUS_COLORS[status] || STATUS_COLORS.normal
  const gradientId = `grad-${status}`

  // Compute average for reference line
  const avg = useMemo(() => {
    if (!history.length) return 0
    return Math.round(history.reduce((s, p) => s + p.watts, 0) / history.length)
  }, [history])

  // Only show every 4th tick to avoid crowding
  const ticks = history.filter((_, i) => i % 4 === 0).map(p => p.t)

  return (
    <div
      className="corner-cut-sm overflow-hidden"
      style={{ background: 'rgba(7,19,48,0.6)', border: '1px solid rgba(59,130,246,0.1)', padding: '16px 8px 8px 0' }}
    >
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={stroke} stopOpacity={0.4} />
              <stop offset="100%" stopColor={fill}   stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
          <XAxis
            dataKey="t"
            ticks={ticks}
            tickFormatter={formatTimeTick}
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}W`}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avg}
            stroke={stroke}
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{ value: `avg ${avg}W`, fill: stroke, fontSize: 8, fontFamily: 'monospace', position: 'insideTopRight' }}
          />
          <Area
            type="monotone"
            dataKey="watts"
            stroke={stroke}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: stroke, strokeWidth: 0 }}
            isAnimationActive
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

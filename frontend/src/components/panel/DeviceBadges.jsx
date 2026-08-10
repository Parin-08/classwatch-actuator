import { Lightbulb, Fan, Snowflake, Monitor } from 'lucide-react'
import { motion } from 'framer-motion'

const DEVICE_CONFIG = [
  { key: 'light',     label: 'Light',     Icon: Lightbulb, onColor: '#fbbf24' },
  { key: 'fan',       label: 'Fan',       Icon: Fan,       onColor: '#60a5fa' },
  { key: 'ac',        label: 'AC',        Icon: Snowflake, onColor: '#34d399' },
  { key: 'projector', label: 'Projector', Icon: Monitor,   onColor: '#a78bfa' },
]

export default function DeviceBadges({ devices }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {DEVICE_CONFIG.map(({ key, label, Icon, onColor }, i) => {
        const isOn = devices?.[key] ?? false

        return (
          <motion.div
            key={key}
            className="flex flex-col items-center gap-2 rounded-xl py-3 px-2"
            style={{
              background: isOn ? `${onColor}12` : 'rgba(255,255,255,0.02)',
              border:     isOn ? `1px solid ${onColor}35` : '1px solid rgba(255,255,255,0.06)',
              transition: 'background 0.3s ease, border-color 0.3s ease',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            {/* Icon chip */}
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width:      38,
                height:     38,
                background:  isOn ? `${onColor}20` : 'rgba(255,255,255,0.04)',
                border:      isOn ? `1px solid ${onColor}45` : '1px solid rgba(255,255,255,0.07)',
                boxShadow:   isOn ? `0 0 12px ${onColor}50, inset 0 0 8px ${onColor}15` : 'none',
                transition:  'all 0.3s ease',
              }}
            >
              <Icon
                size={18}
                strokeWidth={1.5}
                style={{
                  color:      isOn ? onColor : '#334155',
                  filter:     isOn ? `drop-shadow(0 0 5px ${onColor}90)` : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            </div>

            {/* Label */}
            <span
              className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: isOn ? onColor : '#334155' }}
            >
              {label}
            </span>

            {/* ON / OFF pill */}
            <span
              className="text-[8px] font-bold rounded-full px-2 py-0.5"
              style={{
                background: isOn ? `${onColor}25` : 'rgba(255,255,255,0.04)',
                color:      isOn ? onColor : '#1e293b',
                border:     isOn ? `1px solid ${onColor}40` : '1px solid rgba(255,255,255,0.06)',
                letterSpacing: '0.08em',
              }}
            >
              {isOn ? 'ON' : 'OFF'}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

import { useMemo } from 'react'

/**
 * AmbientBackground — pure CSS/SVG ambient layer with:
 *   - Three slow-drifting blurred radial-gradient orbs
 *   - Animated grid mesh drift
 *   - Tiny floating particles (CSS-only, no canvas)
 *
 * All animations use CSS keyframes for zero JS overhead.
 * Opacity and blur are tuned to be extremely subtle.
 */

// Static particle positions — seeded to avoid random re-renders
const PARTICLE_DATA = [
  { left: '8%',  top: '72%', dur: '18s', delay: '0s'   },
  { left: '15%', top: '45%', dur: '24s', delay: '-6s'  },
  { left: '23%', top: '88%', dur: '20s', delay: '-10s' },
  { left: '31%', top: '30%', dur: '16s', delay: '-3s'  },
  { left: '42%', top: '60%', dur: '22s', delay: '-14s' },
  { left: '55%', top: '82%', dur: '19s', delay: '-7s'  },
  { left: '63%', top: '25%', dur: '25s', delay: '-2s'  },
  { left: '71%', top: '68%', dur: '17s', delay: '-11s' },
  { left: '79%', top: '50%', dur: '21s', delay: '-5s'  },
  { left: '88%', top: '35%', dur: '23s', delay: '-16s' },
  { left: '5%',  top: '15%', dur: '26s', delay: '-8s'  },
  { left: '92%', top: '78%', dur: '18s', delay: '-4s'  },
]

export default function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Slow-drifting blurred radial orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />

      {/* Animated grid mesh */}
      <div
        className="absolute inset-0 grid-mesh-drift"
        style={{ opacity: 0.5 }}
      />

      {/* Micro particles floating upward */}
      {PARTICLE_DATA.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            animationDuration: p.dur,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  )
}

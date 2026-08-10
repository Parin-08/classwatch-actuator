/**
 * AnimatedCounter.jsx
 *
 * Smoothly interpolates a numeric value using framer-motion's useSpring.
 * Used in the header stat strip for kW, efficiency %, flagged count, etc.
 *
 * Props:
 *   value    — target number
 *   decimals — decimal places to display (default 0)
 *   prefix   — string to prepend (e.g. "$")
 *   suffix   — string to append (e.g. " kW", "%")
 *   className — extra Tailwind/CSS classes
 */

import { useEffect, useRef } from 'react'
import { useSpring, useMotionValue, motion } from 'framer-motion'

export default function AnimatedCounter({ value, decimals = 0, prefix = '', suffix = '', className = '' }) {
  const raw = useMotionValue(value)
  const spring = useSpring(raw, { stiffness: 60, damping: 18, restDelta: 0.001 })
  const spanRef = useRef(null)

  // Push target to spring whenever value changes
  useEffect(() => {
    raw.set(value)
  }, [value, raw])

  // Subscribe to spring output and write to DOM directly (avoids React re-renders)
  useEffect(() => {
    return spring.on('change', (v) => {
      if (spanRef.current) {
        spanRef.current.textContent = prefix + v.toFixed(decimals) + suffix
      }
    })
  }, [spring, decimals, prefix, suffix])

  return (
    <motion.span ref={spanRef} className={className}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </motion.span>
  )
}

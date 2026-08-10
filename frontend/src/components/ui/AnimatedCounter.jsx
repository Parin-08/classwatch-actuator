/**
 * AnimatedCounter — smoothly tweens a numeric value using Framer Motion's useSpring.
 * Renders a <motion.span> so it can be composed inline with any text.
 *
 * Props:
 *   value     — the target number (updates cause a spring animation)
 *   decimals  — decimal places to display (default 0)
 *   prefix    — string prepended before the number (e.g. "$")
 *   suffix    — string appended after the number (e.g. " kW")
 *   className — extra class names for the span
 */
import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export default function AnimatedCounter({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const spring = useSpring(value, {
    stiffness: 60,
    damping: 18,
    restDelta: 0.001,
  })

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  const display = useTransform(spring, v => {
    const rounded = parseFloat(v.toFixed(decimals))
    return `${prefix}${rounded.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`
  })

  return <motion.span className={className}>{display}</motion.span>
}

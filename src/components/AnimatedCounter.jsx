import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

export default function AnimatedCounter({ from = 0, to, duration = 1, suffix = '' }) {
  const mv = useMotionValue(from)
  const rounded = useTransform(mv, (v) => Math.round(v))

  useEffect(() => {
    const controls = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [mv, to, duration])

  return (
    <motion.span className="font-mono text-jscolors-text-primary">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}


import { motion, useScroll, useSpring, useTransform } from 'framer-motion'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 })
  const opacity = useTransform(scrollYProgress, [0, 0.01], [0, 1])

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[9999] h-[3px] w-full origin-left bg-gradient-to-r from-jscolors-accent-violet to-jscolors-accent-teal pointer-events-none"
      style={{ scaleX, opacity }}
    />
  )
}


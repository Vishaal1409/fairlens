import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

function LensKnot() {
  const geomArgs = useMemo(() => [1.2, 0.35, 128, 32], [])
  useFrame((state) => {
    if (!state.scene) return
    state.scene.rotation.y += 0.003
  })
  return (
    <mesh>
      <torusKnotGeometry args={geomArgs} />
      <meshStandardMaterial
        color="#7C6FF7"
        wireframe
        transparent
        opacity={0.4}
      />
    </mesh>
  )
}

function Typewriter({ text, className }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    let i = 0
    const t = setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(t)
    }, 35)
    return () => clearInterval(t)
  }, [text])
  return <span className={className}>{shown}</span>
}

export default function Hero() {
  return (
    <section id="top" className="relative min-h-[100vh] bg-jscolors-void pt-16 overflow-hidden">
      <div className="pointer-events-none absolute right-[-60px] top-[-60px] z-0 h-[520px] w-[520px] opacity-90">
        <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.6} />
          <pointLight position={[4, 4, 6]} intensity={1.1} />
          <LensKnot />
        </Canvas>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl flex-col items-center justify-center px-5 text-center">
        <h1 className="text-[72px] leading-[0.9] md:text-[140px] font-bold tracking-[-0.02em] text-jscolors-text-primary">
          FAIRLENS
        </h1>
        <p className="mt-5 max-w-2xl text-balance text-[18px] md:text-[22px] text-jscolors-text-secondary">
          Uncover hidden bias. Audit AI fairly.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <a href="#audit" className="btn bg-jscolors-accent-violet text-white">
            Start Audit
          </a>
          <a
            href="#how"
            className="btn border border-jscolors-accent-violet bg-transparent text-jscolors-accent-violet hover:bg-jscolors-accent-violet/10"
          >
            View Demo
          </a>
        </div>

        <p className="mt-4 text-sm text-jscolors-text-muted">
          Trusted by data scientists. Built for fairness.
        </p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="text-left">
            <div className="h-[2px] w-10 bg-jscolors-accent-violet/80" />
            <div className="mt-3 text-sm text-jscolors-text-secondary">Bias Metrics</div>
            <div className="mt-2 text-2xl font-bold">
              <AnimatedCounter to={8} duration={1.1} />
            </div>
          </div>
          <div className="text-left">
            <div className="h-[2px] w-10 bg-jscolors-accent-violet/80" />
            <div className="mt-3 text-sm text-jscolors-text-secondary">Open Source</div>
            <div className="mt-2 text-2xl font-bold">
              <AnimatedCounter to={100} duration={1.2} suffix="%" />
            </div>
          </div>
          <motion.div
            className="text-left"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="h-[2px] w-10 bg-jscolors-accent-violet/80" />
            <div className="mt-3 text-sm text-jscolors-text-secondary">Explainability</div>
            <div className="mt-2 text-2xl font-bold font-mono text-jscolors-text-primary">
              <Typewriter text="SHAP + LIME" />
            </div>
          </motion.div>
        </div>

        <motion.div
          aria-hidden="true"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-jscolors-text-muted"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>
    </section>
  )
}


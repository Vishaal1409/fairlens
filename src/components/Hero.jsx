import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import { useMemo, useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

/* ─────────────────────────────────────────────
   3D: distorted lens core + orbiting wire torus
   ───────────────────────────────────────────── */
function LensCore() {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.rotation.y = t * 0.18
    ref.current.rotation.x = Math.sin(t * 0.22) * 0.18
  })
  return (
    <Float speed={1.1} rotationIntensity={0.35} floatIntensity={1.2}>
      <mesh ref={ref} scale={1.35}>
        <icosahedronGeometry args={[1, 48]} />
        <MeshDistortMaterial
          color="#5BC0EB"
          emissive="#0B223B"
          emissiveIntensity={0.8}
          roughness={0.15}
          metalness={0.9}
          distort={0.36}
          speed={1.4}
        />
      </mesh>
    </Float>
  )
}

function OrbitingWires() {
  const g1 = useRef()
  const g2 = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (g1.current) {
      g1.current.rotation.x = t * 0.12
      g1.current.rotation.y = t * 0.18
    }
    if (g2.current) {
      g2.current.rotation.x = -t * 0.07
      g2.current.rotation.z = t * 0.11
    }
  })
  return (
    <>
      <mesh ref={g1} scale={2.1}>
        <torusGeometry args={[1, 0.003, 8, 160]} />
        <meshBasicMaterial color="#E8D5A8" transparent opacity={0.55} />
      </mesh>
      <mesh ref={g2} scale={2.6}>
        <torusGeometry args={[1, 0.002, 8, 200]} />
        <meshBasicMaterial color="#5BC0EB" transparent opacity={0.35} />
      </mesh>
    </>
  )
}

function LensScene() {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#E8D5A8" />
      <pointLight position={[-4, -3, -2]} intensity={1.4} color="#5BC0EB" />
      <Sparkles count={90} scale={[8, 6, 6]} size={1.4} speed={0.3} opacity={0.55} color="#E8D5A8" />
      <LensCore />
      <OrbitingWires />
    </>
  )
}

/* ─────────────────────────────────────────────
   Subtle parallax on mouse
   ───────────────────────────────────────────── */
function useParallax(strength = 18) {
  const [p, setP] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * strength
      const y = (e.clientY / window.innerHeight - 0.5) * strength
      setP({ x, y })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [strength])
  return p
}

/* ─────────────────────────────────────────────
   Hero
   ───────────────────────────────────────────── */
export default function Hero() {
  const { scrollY } = useScroll()
  const yBg = useTransform(scrollY, [0, 800], [0, -180])
  const scaleBg = useTransform(scrollY, [0, 800], [1, 1.06])
  const opacityBg = useTransform(scrollY, [0, 700], [1, 0.2])

  const parallax = useParallax(18)

  return (
    <section
      id="top"
      className="relative isolate min-h-[100vh] overflow-hidden pt-16"
    >
      {/* ─── 3D canvas — parallaxed & fades on scroll ─── */}
      <motion.div
        aria-hidden="true"
        style={{ y: yBg, scale: scaleBg, opacity: opacityBg }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        <Canvas camera={{ position: [0, 0, 4.4], fov: 42 }} dpr={[1, 2]}>
          <LensScene />
        </Canvas>
      </motion.div>

      {/* Decorative conic ring behind headline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[50%] z-[1] -translate-x-1/2 -translate-y-1/2"
        style={{
          transform: `translate(calc(-50% + ${parallax.x * 0.35}px), calc(-50% + ${parallax.y * 0.35}px))`,
        }}
      >
        <div className="conic-ring orbit h-[620px] w-[620px] rounded-full opacity-45 blur-[2px] md:h-[820px] md:w-[820px]" />
      </div>

      {/* Deep gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            'radial-gradient(900px 600px at 50% 50%, rgba(5,6,10,0) 0%, rgba(5,6,10,0.45) 55%, rgba(5,6,10,0.9) 100%)',
        }}
      />

      {/* ─── Editorial frame: left + right columns ─── */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-[1320px] flex-col justify-center px-6 md:px-12">
        {/* Top meta row */}
        <div className="reveal mb-10 flex items-end justify-between" style={{ '--i': 0 }}>
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-10 bg-obs-cerulean/70" />
            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-obs-dim">
              Instrument · Vol 04
            </span>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-obs-dim">
              Observation N° 024
            </span>
            <span className="h-[1px] w-10 bg-obs-lumen/60" />
          </div>
        </div>

        {/* Headline — editorial display serif, asymmetric */}
        <div className="relative">
          <h1
            className="reveal-blur h-display text-[88px] leading-[0.86] text-obs-text md:text-[180px]"
            style={{ '--i': 1 }}
          >
            Fair<span className="italic text-obs-lumen">Lens</span>
          </h1>

          {/* Floating accent dot */}
          <span
            aria-hidden="true"
            className="absolute -top-4 right-6 inline-block h-3 w-3 rounded-full bg-obs-cerulean shadow-[0_0_20px_#5BC0EB] md:-top-6"
          />

          {/* Subhead — editorial lede */}
          <p
            className="reveal mt-8 max-w-[620px] text-balance text-[17px] leading-relaxed text-obs-dim md:text-[21px]"
            style={{ '--i': 3 }}
          >
            A precision instrument for auditing machine-learning fairness.
            <span className="text-obs-text"> Measure bias</span>, reason about
            causes with <span className="text-obs-text">SHAP</span> and <span className="text-obs-text">LIME</span>,
            and apply verifiable mitigation — in a single, unhurried workflow.
          </p>
        </div>

        {/* CTA row — asymmetric */}
        <div
          className="reveal mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          style={{ '--i': 4 }}
        >
          <a
            href="#audit"
            className="btn group relative overflow-hidden bg-obs-cerulean text-obs-void hover:bg-obs-lumen"
            style={{ letterSpacing: '0.04em' }}
          >
            <span className="relative z-10">Begin observation</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="relative z-10 transition-transform group-hover:translate-x-1">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href="#how"
            className="group inline-flex items-center gap-3 px-2 py-3 font-mono text-[11px] uppercase tracking-[0.32em] text-obs-dim hover:text-obs-text"
          >
            <span className="inline-block h-[1px] w-8 bg-obs-dim/60 transition-all group-hover:w-16 group-hover:bg-obs-cerulean" />
            View method
          </a>
        </div>

        {/* Metrics strip — editorial hairline-separated */}
        <div
          className="reveal mt-16 grid w-full max-w-[880px] grid-cols-1 gap-0 border-t border-white/8 sm:mt-20 sm:grid-cols-3"
          style={{ '--i': 5 }}
        >
          <MetricCell
            num={<AnimatedCounter to={8} duration={1.2} />}
            label="Fairness metrics"
            sub="DP · EO · DI · EqOdd · ..."
          />
          <MetricCell
            num={<AnimatedCounter to={100} duration={1.4} suffix="%" />}
            label="Open source"
            sub="MIT · Auditable"
            divider
          />
          <MetricCell
            num={<span className="font-display italic">&lt;60s</span>}
            label="End-to-end audit"
            sub="Upload to mitigation"
            divider
          />
        </div>

        {/* Scroll cue — thin vertical line that bobs */}
        <div
          className="pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
          aria-hidden="true"
        >
          <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-obs-dim chevron-bob">
            Scroll
          </span>
          <span className="block h-10 w-px bg-gradient-to-b from-obs-cerulean/70 to-transparent" />
        </div>
      </div>

      {/* Decorative vertical ruler on the right edge */}
      <VerticalRuler />
    </section>
  )
}

function MetricCell({ num, label, sub, divider }) {
  return (
    <div
      className={`relative border-b border-white/8 px-6 py-6 sm:border-b-0 sm:py-8 ${
        divider ? 'sm:border-l sm:border-white/8' : ''
      }`}
    >
      <div className="num-display text-[44px] text-obs-text sm:text-[56px] md:text-[72px]">{num}</div>
      <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.32em] text-obs-dim">
        {label}
      </div>
      <div className="mt-1 font-mono text-[10px] text-obs-ghost">{sub}</div>
    </div>
  )
}

function VerticalRuler() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-2 md:flex"
    >
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="block bg-white/20"
          style={{
            height: '1px',
            width: i % 5 === 0 ? '22px' : i % 2 === 0 ? '10px' : '6px',
            opacity: i % 5 === 0 ? 0.75 : 0.45,
          }}
        />
      ))}
    </div>
  )
}

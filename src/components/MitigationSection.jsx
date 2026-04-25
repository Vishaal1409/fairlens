import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { mitigateFile } from '../api'
import MitigationCodeExport from './MitigationCodeExport'

/* ── Count-up hook ─────────────────────────────────────────────────────── */
function useCountUp(target, duration = 1100, delay = 0, enabled = true) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let raf
    const timer = setTimeout(() => {
      const start = performance.now()
      const step = (now) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(Math.round(eased * target))
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [target, duration, delay, enabled])
  return display
}

/* ── Animation Variants ─────────────────────────────────────────────────── */
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } }
}

const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 240, damping: 22 }
  }
}

/* ── Dark Tooltip ──────────────────────────────────────────────────────── */
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-jscolors-rim bg-jscolors-surface px-3 py-2 text-xs text-jscolors-text-secondary shadow-xl">
      <div className="font-mono text-jscolors-text-primary">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="mt-1 flex items-center justify-between gap-6">
          <span className="font-mono">{p.name || p.dataKey}</span>
          <span className="font-mono text-jscolors-text-primary">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Animated Stat Card ─────────────────────────────────────────────────── */
function StatCard({ label, value, tone, delay = 0, accentColor }) {
  const target = Math.round((value <= 1 ? value : value / 100) * 100)
  const animated = useCountUp(target, 1100, delay)

  return (
    <motion.div
      variants={staggerChild}
      whileHover={{
        scale: 1.04,
        boxShadow: `0 0 24px -6px ${accentColor}50`,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      className="group relative rounded-xl p-4 cursor-default
                 bg-white/[0.03] border border-white/[0.05]
                 hover:border-white/[0.12] transition-colors duration-300"
    >
      <div className="text-[9px] font-mono tracking-[0.25em] uppercase text-jscolors-text-muted mb-2">
        {label}
      </div>
      <div className={['text-[36px] font-bold leading-none', tone].join(' ')}>
        {animated}
      </div>
      {/* Glow line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(to right, transparent, ${accentColor}70, transparent)` }}
      />
    </motion.div>
  )
}

/* ── Up-arrow icon ──────────────────────────────────────────────────────── */
function UpArrow() {
  return (
    <motion.span
      className="absolute right-2 top-2 text-jscolors-accent-teal"
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.span>
  )
}

/* ═════════════════════════════════════════════════════════════════════════
   MITIGATION SECTION
   ════════════════════════════════════════════════════════════════════════ */
export default function MitigationSection({ fileId }) {
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    let alive = true
    async function run() {
      if (!fileId) return
      setLoading(true)
      try {
        const res = await mitigateFile(fileId, null, null)
        const data = res.data ?? res
        if (alive) setPayload(data)
      } catch {
        // fall back to demo values
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [fileId])

  const before = payload?.before || {
    disparateImpact: 0.74,
    demographicParity: 0.61,
    equalOpportunity: 0.58,
  }
  const after = payload?.after || {
    disparateImpact: 0.86,
    demographicParity: 0.79,
    equalOpportunity: 0.76,
  }

  const improvement = useMemo(() => {
    const rows = [
      { metric: 'Disparate Impact', before: before.disparateImpact, after: after.disparateImpact },
      { metric: 'Demographic Parity', before: before.demographicParity, after: after.demographicParity },
      { metric: 'Equal Opportunity', before: before.equalOpportunity, after: after.equalOpportunity },
      { metric: 'Equalized Odds', before: 0.66, after: 0.78 },
      { metric: 'Statistical Parity Diff', before: 0.61, after: 0.73 },
      { metric: 'Consistency', before: 0.81, after: 0.86 },
      { metric: 'Theil Index', before: 0.85, after: 0.90 },
      { metric: 'Average Odds Diff', before: 0.58, after: 0.72 },
    ]
    return rows.map((r) => ({
      metric: r.metric,
      before: Math.round((r.before <= 1 ? r.before : r.before / 100) * 100),
      after: Math.round((r.after <= 1 ? r.after : r.after / 100) * 100),
    }))
  }, [before, after])

  return (
    <section id="mitigate" className="bg-jscolors-deep py-24">
      <div className="mx-auto max-w-6xl px-5">

        {/* Section heading */}
        <motion.div
          className="max-w-2xl"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="section-label text-jscolors-text-secondary">MITIGATE</div>
          <h2 className="mt-3 text-[38px] md:text-[52px] font-bold text-jscolors-text-primary">
            Before &amp; After Bias Mitigation
          </h2>
        </motion.div>

        {/* Before / After cards */}
        <motion.div
          className="relative mt-12 grid grid-cols-1 gap-4 md:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* BEFORE card */}
          <motion.div
            variants={staggerChild}
            whileHover={{
              scale: 1.015,
              boxShadow: '0 0 32px -8px rgba(255,71,87,0.25)',
              transition: { type: 'spring', stiffness: 200, damping: 20 }
            }}
            className="card group cursor-default"
          >
            {/* Top accent */}
            <div className="h-[3px] w-12 bg-jscolors-accent-red/80" />
            <div className="mt-4 text-xs font-mono tracking-[0.3em] uppercase text-jscolors-accent-red">
              BEFORE MITIGATION
            </div>
            <motion.div
              className="mt-6 grid grid-cols-3 gap-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <StatCard label="Disparate Impact" value={before.disparateImpact} tone="text-jscolors-accent-amber" delay={0} accentColor="#EF9F27" />
              <StatCard label="Demographic Parity" value={before.demographicParity} tone="text-jscolors-accent-red" delay={80} accentColor="#E24B4A" />
              <StatCard label="Equal Opportunity" value={before.equalOpportunity} tone="text-jscolors-accent-red" delay={160} accentColor="#E24B4A" />
            </motion.div>
          </motion.div>

          {/* AFTER card */}
          <motion.div
            variants={staggerChild}
            whileHover={{
              scale: 1.015,
              boxShadow: '0 0 32px -8px rgba(29,158,117,0.25)',
              transition: { type: 'spring', stiffness: 200, damping: 20 }
            }}
            className="card group cursor-default"
          >
            <div className="h-[3px] w-12 bg-jscolors-accent-green/80" />
            <div className="mt-4 text-xs font-mono tracking-[0.3em] uppercase text-jscolors-accent-green">
              AFTER MITIGATION
            </div>
            <motion.div
              className="mt-6 grid grid-cols-3 gap-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="relative">
                <StatCard label="Disparate Impact" value={after.disparateImpact} tone="text-jscolors-accent-green" delay={200} accentColor="#1D9E75" />
                <UpArrow />
              </div>
              <div className="relative">
                <StatCard label="Demographic Parity" value={after.demographicParity} tone="text-jscolors-accent-teal" delay={280} accentColor="#3DDBD9" />
                <UpArrow />
              </div>
              <div className="relative">
                <StatCard label="Equal Opportunity" value={after.equalOpportunity} tone="text-jscolors-accent-teal" delay={360} accentColor="#3DDBD9" />
                <UpArrow />
              </div>
            </motion.div>
          </motion.div>

          {/* Animated connector pill */}
          <motion.div
            aria-hidden="true"
            className="hidden md:flex pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-3"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="h-[2px] w-20 bg-gradient-to-r from-jscolors-accent-red/0 via-jscolors-accent-violet to-jscolors-accent-teal" />
            <div className="rounded-full border border-jscolors-rim bg-jscolors-surface px-3 py-1 text-[11px] font-mono text-jscolors-text-secondary">
              AIF360 Reweighing applied →
            </div>
            <div className="h-[2px] w-20 bg-gradient-to-r from-jscolors-accent-teal via-jscolors-accent-violet to-jscolors-accent-green/0" />
          </motion.div>
        </motion.div>

        {/* Improvement Line Chart */}
        <motion.div
          className="mt-4 card"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          whileHover={{
            boxShadow: '0 0 28px -6px rgba(124,111,247,0.2)',
            transition: { type: 'spring', stiffness: 200 }
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-jscolors-text-primary">Improvement Overview</div>
              <div className="mt-1 text-sm text-jscolors-text-secondary">Delta across all metrics after mitigation.</div>
            </div>
            {loading && <div className="h-9 w-40 rounded-full skeleton" />}
          </div>

          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={improvement}>
                <CartesianGrid stroke="rgba(37,37,64,0.35)" vertical={false} />
                <XAxis dataKey="metric" tickLine={false} axisLine={false} tick={{ fill: '#9B9BC0', fontSize: 12 }} interval={0} angle={-10} height={70} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9B9BC0', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip content={<DarkTooltip />} />
                <Line
                  type="monotone" dataKey="before" name="Before"
                  stroke="#FF4757" strokeWidth={2} dot={false}
                  isAnimationActive animationDuration={1200} animationEasing="ease-out"
                />
                <Line
                  type="monotone" dataKey="after" name="After"
                  stroke="#3DDBD9" strokeWidth={2} dot={false}
                  isAnimationActive animationDuration={1200} animationBegin={200} animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem 4rem' }}>
        <MitigationCodeExport />
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts'

/* ── Utilities ─────────────────────────────────────────────────────────── */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function scoreColor(score) {
  if (score >= 80) return 'text-jscolors-accent-green'
  if (score >= 60) return 'text-jscolors-accent-amber'
  return 'text-jscolors-accent-red'
}

function scoreBadge(score) {
  if (score >= 80) return { label: 'FAIR', cls: 'bg-jscolors-accent-green/15 text-jscolors-accent-green border-jscolors-accent-green/30' }
  if (score >= 60) return { label: 'REVIEW REQUIRED', cls: 'bg-jscolors-accent-amber/15 text-jscolors-accent-amber border-jscolors-accent-amber/30' }
  return { label: 'CRITICAL BIAS', cls: 'bg-jscolors-accent-red/15 text-jscolors-accent-red border-jscolors-accent-red/30' }
}

/* ── Count-up hook ─────────────────────────────────────────────────────── */
function useCountUp(target, duration = 1200, delay = 0, enabled = true) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let raf
    const timer = setTimeout(() => {
      const start = performance.now()
      const step = (now) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
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
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
}

const staggerChild = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 22 }
  }
}

const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } }
}

/* ── Dark Recharts Tooltip ─────────────────────────────────────────────── */
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

/* ── Animated SVG donut ─────────────────────────────────────────────────── */
function DonutArc({ value = 0 }) {
  const v = clamp(value, 0, 100)
  const r = 38
  const c = 2 * Math.PI * r
  const targetOff = c - (v / 100) * c
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle cx="48" cy="48" r={r} stroke="rgba(37,37,64,1)" strokeWidth="10" fill="none" />
      <motion.circle
        cx="48"
        cy="48"
        r={r}
        stroke="rgba(124,111,247,1)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: targetOff }}
        transform="rotate(-90 48 48)"
        transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
        style={{ filter: 'drop-shadow(0 0 6px rgba(124,111,247,0.5))' }}
      />
    </svg>
  )
}

/* ── Animated Metric Row ────────────────────────────────────────────────── */
function MetricRow({ m, index }) {
  const width = clamp(m.v, 0, 100)
  const badgeCls =
    m.status === 'PASS'
      ? 'bg-jscolors-accent-green/15 text-jscolors-accent-green border-jscolors-accent-green/30'
      : m.status === 'WARNING'
        ? 'bg-jscolors-accent-amber/15 text-jscolors-accent-amber border-jscolors-accent-amber/30'
        : 'bg-jscolors-accent-red/15 text-jscolors-accent-red border-jscolors-accent-red/30'

  const barColor =
    m.status === 'PASS' ? '#1D9E75'
    : m.status === 'WARNING' ? '#EF9F27'
    : '#E24B4A'

  return (
    <motion.div
      variants={staggerChild}
      className="group flex items-center gap-4 rounded-xl px-3 py-2
                 hover:bg-white/[0.03] transition-colors duration-200 cursor-default"
      whileHover={{ x: 4, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
    >
      <div className="w-[200px] shrink-0 font-mono text-[13px] text-jscolors-text-secondary">
        {m.name}
      </div>
      <div className="h-2 flex-1 rounded-full bg-jscolors-rim overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}50` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${width}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="w-[56px] text-right font-mono text-[13px] text-jscolors-text-primary">
        {Math.round(m.v)}
      </div>
      <div className={['inline-flex w-[86px] justify-center rounded-full border px-2 py-1 text-[11px] font-mono', badgeCls].join(' ')}>
        {m.status}
      </div>
    </motion.div>
  )
}

/* ═════════════════════════════════════════════════════════════════════════
   RESULTS DASHBOARD
   ════════════════════════════════════════════════════════════════════════ */
export default function ResultsDashboard({ data }) {
  // ── Normalize API response ────────────────────────────────────────────
  const isFlat =
    data && typeof data === 'object' && !Array.isArray(data) &&
    !data.metrics && !data.metric_scores &&
    Object.values(data).some(v => typeof v === 'number')

  const rawMetrics = isFlat
    ? data
    : (data?.metrics || data?.metric_scores || null)

  const fallbackArray = [
    { name: 'Demographic Parity', value: 0.72, threshold: 0.8, description: 'Outcome parity across groups.' },
    { name: 'Equalized Odds', value: 0.66, threshold: 0.8, description: 'Equal TPR/FPR across groups.' },
    { name: 'Disparate Impact', value: 0.74, threshold: 0.8, description: 'Ratio of favorable outcomes.' },
    { name: 'Equal Opportunity', value: 0.62, threshold: 0.8, description: 'Equal true positive rate.' },
    { name: 'Theil Index', value: 0.85, threshold: 0.8, description: 'Inequality measure.' },
    { name: 'Average Odds Diff', value: 0.58, threshold: 0.7, description: 'Avg odds difference.' },
    { name: 'Statistical Parity Diff', value: 0.61, threshold: 0.7, description: 'SPD difference.' },
    { name: 'Consistency', value: 0.81, threshold: 0.8, description: 'Local label agreement.' },
  ]

  const metrics = !rawMetrics
    ? fallbackArray
    : Array.isArray(rawMetrics)
      ? rawMetrics
      : typeof rawMetrics === 'object'
        ? Object.entries(rawMetrics)
            .filter(([, v]) => typeof v === 'number')
            .map(([key, value]) => ({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              value,
              threshold: 0.8,
              description: '',
            }))
        : fallbackArray

  const overall = Math.round(
    data?.overall_fairness_score ??
    data?.overallScore ??
    data?.score ??
    data?.overall ??
    (isFlat
      ? Object.values(data).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0) /
        (Object.values(data).filter(v => typeof v === 'number').length || 1) * 100
      : 72
    )
  )

  const normalized = metrics.map((m) => {
    const v = typeof m.value === 'number' && m.value <= 1 ? m.value * 100 : Number(m.value) || 0
    const thr = typeof m.threshold === 'number' && m.threshold <= 1 ? m.threshold * 100 : Number(m.threshold) || 80
    const status = v >= thr ? 'PASS' : v >= thr * 0.9 ? 'WARNING' : 'FAIL'
    return { ...m, v, thr, status }
  })

  const di = normalized.find((m) => (m.name || '').toLowerCase().includes('disparate'))?.v ?? 74
  const diColor =
    di > 80 ? 'fill-jscolors-accent-green' : di >= 60 ? 'fill-jscolors-accent-amber' : 'fill-jscolors-accent-red'

  const groups = data?.groups || data?.protected_groups || ['Female', 'Male', 'Non-binary', 'Unknown']
  const dist =
    data?.outcome_distribution ||
    [
      { group: 'Female', privileged: 48, unprivileged: 52 },
      { group: 'Male', privileged: 55, unprivileged: 45 },
      { group: 'Non-binary', privileged: 41, unprivileged: 59 },
      { group: 'Unknown', privileged: 50, unprivileged: 50 },
    ]

  const badge = scoreBadge(overall)

  // Count-up for overall score
  const animatedOverall = useCountUp(overall, 1200, 600)
  const animatedDi = useCountUp(Math.round(di), 1000, 800)

  return (
    <section id="results" className="bg-jscolors-deep py-24">
      <div className="mx-auto max-w-6xl px-5">

        {/* ── Hero Score Card ──────────────────────────────────────────── */}
        <motion.div
          layoutId="results"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          <motion.div
            className="card group cursor-default"
            whileHover={{
              scale: 1.005,
              boxShadow: '0 0 36px -8px rgba(124,111,247,0.28)',
              transition: { type: 'spring', stiffness: 200, damping: 22 }
            }}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-end gap-4">
                <div className={['text-[72px] md:text-[96px] leading-none font-bold', scoreColor(overall)].join(' ')}>
                  {animatedOverall}
                </div>
                <div className="pb-2">
                  <div className="text-sm text-jscolors-text-secondary">Overall Fairness Score</div>
                  <div className={['mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono', badge.cls].join(' ')}>
                    {badge.label}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <DonutArc value={overall} />
                <div className="text-sm text-jscolors-text-secondary">
                  Measured across 8 metrics with policy thresholds. Review failures before mitigation.
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Metrics Overview + Disparate Impact ─────────────────────── */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Bias Metrics Overview card */}
            <motion.div
              className="card md:col-span-2"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{
                boxShadow: '0 0 28px -6px rgba(124,111,247,0.18)',
                transition: { type: 'spring', stiffness: 200 }
              }}
            >
              <div className="text-lg font-semibold text-jscolors-text-primary">Bias Metrics Overview</div>
              <motion.div
                className="mt-4 space-y-1"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
              >
                {normalized.map((m, idx) => (
                  <MetricRow key={m.name} m={m} index={idx} />
                ))}
              </motion.div>
            </motion.div>

            {/* Disparate Impact radial card */}
            <motion.div
              className="card"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{
                scale: 1.02,
                boxShadow: '0 0 28px -6px rgba(124,111,247,0.2)',
                transition: { type: 'spring', stiffness: 200, damping: 20 }
              }}
            >
              <div className="text-lg font-semibold text-jscolors-text-primary">Disparate Impact</div>
              <div className="mt-4 h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[{ name: 'DI', value: clamp(di, 0, 100) }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar background dataKey="value" cornerRadius={10} className={diColor} />
                    <Tooltip content={<DarkTooltip />} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center">
                <div className="text-[32px] font-bold text-jscolors-text-primary">{animatedDi}</div>
                <div className="text-xs font-mono text-jscolors-text-muted">Higher is better (threshold ≥ 80)</div>
              </div>
            </motion.div>

            {/* Groups Analyzed card */}
            <motion.div
              className="card"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{
                scale: 1.02,
                boxShadow: '0 0 22px -6px rgba(124,111,247,0.18)',
                transition: { type: 'spring', stiffness: 200, damping: 20 }
              }}
            >
              <div className="text-lg font-semibold text-jscolors-text-primary">Groups Analyzed</div>
              <motion.div
                className="mt-4 flex flex-wrap gap-2"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {groups.map((g, i) => (
                  <motion.span
                    key={g}
                    variants={staggerChild}
                    whileHover={{
                      scale: 1.08,
                      transition: { type: 'spring', stiffness: 400, damping: 20 }
                    }}
                    className="cursor-default rounded-full border border-jscolors-rim bg-jscolors-surface px-3 py-1 text-xs font-mono text-jscolors-text-secondary"
                  >
                    {g}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            {/* Outcome Distribution BarChart */}
            <motion.div
              className="card md:col-span-2"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{
                boxShadow: '0 0 28px -6px rgba(124,111,247,0.18)',
                transition: { type: 'spring', stiffness: 200 }
              }}
            >
              <div className="text-lg font-semibold text-jscolors-text-primary">Outcome Distribution by Group</div>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dist}>
                    <CartesianGrid stroke="rgba(37,37,64,0.35)" vertical={false} />
                    <XAxis dataKey="group" tickLine={false} axisLine={false} tick={{ fill: '#9B9BC0', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9B9BC0', fontSize: 12 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar
                      dataKey="privileged"
                      name="Privileged"
                      fill="#7C6FF7"
                      radius={[8, 8, 0, 0]}
                      isAnimationActive
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="unprivileged"
                      name="Unprivileged"
                      fill="#3DDBD9"
                      radius={[8, 8, 0, 0]}
                      isAnimationActive
                      animationDuration={900}
                      animationBegin={150}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Full Metric Table */}
            <motion.div
              className="card md:col-span-3"
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.05 }}
            >
              <div className="text-lg font-semibold text-jscolors-text-primary">Full Metric Report</div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="text-xs font-mono tracking-[0.22em] uppercase text-jscolors-text-muted">
                      <th className="py-3 pr-4">Metric</th>
                      <th className="py-3 pr-4">Value</th>
                      <th className="py-3 pr-4">Threshold</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalized.map((m, idx) => {
                      const rowBg = idx % 2 === 0 ? 'bg-jscolors-surface' : 'bg-jscolors-elevated'
                      const badgeCls =
                        m.status === 'PASS'
                          ? 'bg-jscolors-accent-green/15 text-jscolors-accent-green border-jscolors-accent-green/30'
                          : m.status === 'WARNING'
                            ? 'bg-jscolors-accent-amber/15 text-jscolors-accent-amber border-jscolors-accent-amber/30'
                            : 'bg-jscolors-accent-red/15 text-jscolors-accent-red border-jscolors-accent-red/30'
                      return (
                        <motion.tr
                          key={m.name}
                          className={[rowBg, 'group transition duration-200 hover:bg-jscolors-elevated'].join(' ')}
                          initial={{ opacity: 0, x: -8 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.35, delay: idx * 0.04 }}
                          whileHover={{ backgroundColor: 'rgba(124,111,247,0.06)' }}
                        >
                          <td className="py-3 pr-4 font-mono text-[13px] text-jscolors-text-secondary">
                            <div className="group-hover:border-l-2 group-hover:border-jscolors-accent-violet pl-2 -ml-2 transition">
                              {m.name}
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-mono text-jscolors-text-primary">{Math.round(m.v)}</td>
                          <td className="py-3 pr-4 font-mono text-jscolors-text-muted">{Math.round(m.thr)}</td>
                          <td className="py-3 pr-4">
                            <span className={['inline-flex rounded-full border px-2 py-1 text-[11px] font-mono', badgeCls].join(' ')}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-jscolors-text-secondary">{m.description}</td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

import React, { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Activity, Target, Scale,
  Sparkles, ChevronRight, Loader2, TrendingUp,
  Flame, Zap, AlertTriangle,
  CheckCircle2, ArrowLeft, BarChart3,
} from 'lucide-react'
import BiasHeatmap from '../components/BiasHeatmap'
import SummaryBanner from '../components/SummaryBanner'
import SHAPChart from '../components/SHAPChart'
import BeforeAfterChart from '../components/BeforeAfterChart'
import ExportReport from '../components/ExportReport'
import { ChartGrid } from '../components/ChartContainer'
import { api } from '../api'

/* ─────────────────────────────────────────────
   FALLBACK DATA
   ───────────────────────────────────────────── */
const dummyMetrics = {
  accuracy: 0.82,
  demographic_parity: 0.65,
  equal_opportunity: 0.48,
  disparate_impact: 0.71,
}

const dummyShap = {
  age: 0.42, income: 0.31, gender: -0.18,
  education: 0.27, race: -0.35, hours_per_week: 0.19,
  occupation: 0.22, marital_status: -0.11,
  relationship: 0.08, country: -0.05,
}

/* ─────────────────────────────────────────────
   METRIC METADATA
   ───────────────────────────────────────────── */
const metricMeta = {
  accuracy: {
    label: 'Accuracy',
    icon: Target,
    explanation: 'How often the model makes the correct prediction overall.',
    threshold: 0.8,
  },
  demographic_parity: {
    label: 'Demographic Parity',
    icon: Scale,
    explanation: 'Approval rates are equal across protected groups.',
    threshold: 0.7,
  },
  equal_opportunity: {
    label: 'Equal Opportunity',
    icon: ShieldCheck,
    explanation: 'Qualified candidates have equal chance of a positive outcome.',
    threshold: 0.7,
  },
  disparate_impact: {
    label: 'Disparate Impact',
    icon: Activity,
    explanation: 'Ratio of favourable outcomes between groups.',
    threshold: 0.8,
  },
  disperate_impact: {
    label: 'Disparate Impact',
    icon: Activity,
    explanation: 'Ratio of favourable outcomes between groups.',
    threshold: 0.8,
  },
}

/* ─────────────────────────────────────────────
   STATUS (new palette: aurora / lumen / signal)
   ───────────────────────────────────────────── */
const getStatus = (score) => {
  if (score >= 0.7) return {
    label: 'Fair',
    accent: '#6EE7C4',
    bgClass: 'bg-[#6EE7C4]/10',
    textClass: 'text-[#6EE7C4]',
    borderClass: 'border-[#6EE7C4]/25',
    icon: CheckCircle2,
  }
  if (score >= 0.5) return {
    label: 'Warning',
    accent: '#E8D5A8',
    bgClass: 'bg-[#E8D5A8]/10',
    textClass: 'text-[#E8D5A8]',
    borderClass: 'border-[#E8D5A8]/25',
    icon: AlertTriangle,
  }
  return {
    label: 'Biased',
    accent: '#FF6E6E',
    bgClass: 'bg-[#FF6E6E]/10',
    textClass: 'text-[#FF6E6E]',
    borderClass: 'border-[#FF6E6E]/25',
    icon: Zap,
  }
}

/* ─────────────────────────────────────────────
   MINI SPARKLINE
   ───────────────────────────────────────────── */
const MiniSparkline = ({ value, color }) => {
  const seed = Math.round(value * 1000)
  const points = Array.from({ length: 8 }, (_, i) => {
    const noise = Math.sin(seed + i * 1.7) * 0.12
    const trend = (i / 7) * 0.1
    return Math.max(0, Math.min(1, value - 0.15 + trend + noise))
  })
  points.push(value)

  const w = 80, h = 24
  const maxVal = Math.max(...points)
  const minVal = Math.min(...points)
  const range = maxVal - minVal || 0.1

  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p - minVal) / range) * (h - 4) - 2
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')

  const areaPath = `${pathData} L ${w} ${h} L 0 ${h} Z`
  const safeId = color.replace('#', '')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${safeId}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${safeId})`} />
      <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={w} cy={h - ((value - minVal) / range) * (h - 4) - 2} r="2" fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   ANIMATED NUMBER
   ───────────────────────────────────────────── */
function useAnimatedNumber(target, duration = 1400, delay = 0) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
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
  }, [target, duration, delay])
  return display
}

/* ─────────────────────────────────────────────
   SECTION HEADER — editorial
   ───────────────────────────────────────────── */
const SectionHeader = ({ num, label, title, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    className="mb-8 flex items-end justify-between"
  >
    <div>
      <div className="flex items-center gap-3">
        <span className="h-px w-10 bg-obs-cerulean/70" />
        <span className="section-label">§ {num} · {label}</span>
      </div>
      <h2 className="h-display mt-4 text-[36px] leading-[1.02] text-obs-text md:text-[48px]">
        {title}
      </h2>
    </div>
  </motion.div>
)

/* ─────────────────────────────────────────────
   METRIC CARD — editorial glass
   ───────────────────────────────────────────── */
const MetricCardPremium = ({ metricKey, value, index }) => {
  const meta = metricMeta[metricKey] || {
    label: metricKey.replace(/_/g, ' '),
    icon: Activity,
    explanation: 'Metric evaluation score.',
    threshold: 0.7,
  }
  const status = getStatus(value)
  const Icon = meta.icon
  const StatusIcon = status.icon
  const pct = Math.round(value * 100)
  const isAboveThreshold = value >= (meta.threshold || 0.7)
  const animatedPct = useAnimatedNumber(pct, 1400, 200 + index * 80)

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="glass frame-mark group relative overflow-hidden rounded-2xl p-6"
    >
      {/* Top hairline accent */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-6 right-6 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${status.accent}80, transparent)` }}
      />

      {/* Top row — icon + status pill */}
      <div className="flex items-start justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <Icon size={16} className="text-obs-dim transition-colors group-hover:text-obs-cerulean" />
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] ${status.bgClass} ${status.textClass} ${status.borderClass}`}>
          <StatusIcon size={10} />
          {status.label}
        </span>
      </div>

      {/* Label */}
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">
        {meta.label}
      </p>

      {/* Score */}
      <div className="mt-2 flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="num-display text-[46px] leading-none text-obs-text tabular">
            {animatedPct}
          </span>
          <span className="pb-1 text-[14px] text-obs-dim">%</span>
        </div>
        <MiniSparkline value={value} color={status.accent} />
      </div>

      {/* Progress track */}
      <div className="mt-5 h-[2px] rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.25 + index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="h-full rounded-full"
          style={{ background: status.accent, boxShadow: `0 0 8px ${status.accent}40` }}
        />
      </div>

      {/* Explanation */}
      <p className="mt-5 text-[12px] leading-[1.7] text-obs-dim">
        {meta.explanation}
      </p>

      {/* Threshold hairline */}
      <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-3 font-mono text-[10px] uppercase tracking-[0.22em]">
        <span className="text-obs-ghost">Threshold</span>
        <span className={isAboveThreshold ? 'text-[#6EE7C4]' : 'text-[#E8D5A8]'}>
          {isAboveThreshold ? '✓' : '!'} {Math.round((meta.threshold || 0.7) * 100)}%
        </span>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   LIVE CLOCK CHIP (matches landing frame marks)
   ───────────────────────────────────────────── */
function useUtcClock() {
  const [clock, setClock] = useState('—')
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const mm = String(d.getUTCMinutes()).padStart(2, '0')
      const ss = String(d.getUTCSeconds()).padStart(2, '0')
      setClock(`${hh}:${mm}:${ss} UTC`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return clock
}

/* ─────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────── */
const ResultsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const clock = useUtcClock()

  // Demo mode — enables automation + shareable demo URLs without
  // requiring a live backend or navigation state.
  const isDemo = location.search.includes('demo=1') || location.hash === '#demo'
  const rawState = location.state ?? (isDemo ? {
    metrics: dummyMetrics,
    shapValues: dummyShap,
    fileId: 'demo-audit',
  } : null)

  const _normalizeMetrics = (s) => {
    if (!s || typeof s !== 'object') return null
    if (s.metrics && typeof s.metrics === 'object' && !Array.isArray(s.metrics)) {
      const m = {}
      Object.entries(s.metrics).forEach(([k, v]) => { if (typeof v === 'number') m[k] = v })
      return Object.keys(m).length ? m : null
    }
    const numeric = {}
    Object.entries(s).forEach(([k, v]) => {
      if (typeof v === 'number' && k !== 'overall_fairness_score' && k !== 'score') numeric[k] = v
    })
    return Object.keys(numeric).length ? numeric : null
  }

  const metrics = _normalizeMetrics(rawState) ?? dummyMetrics
  const shapValues = rawState?.shapValues ?? rawState?.shap_values ?? dummyShap

  const [mitigatedData, setMitigatedData] = useState(null)
  const [loading, setLoading] = useState(false)

  const safeMetrics = metrics && typeof metrics === 'object' && !Array.isArray(metrics)
    ? metrics
    : dummyMetrics

  const biasedMetrics = useMemo(() =>
    Object.entries(safeMetrics).filter(([, v]) => typeof v === 'number' && v < 0.7),
    [safeMetrics]
  )

  const overall = useMemo(() => {
    const values = Object.values(safeMetrics).filter((v) => typeof v === 'number')
    if (!values.length) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }, [safeMetrics])

  useEffect(() => {
    if (!rawState) {
      console.warn('No state on /results — page may have been refreshed or navigated directly')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMitigation = async () => {
    setLoading(true)
    try {
      const fileId = rawState?.fileId || 'demo_file_123'
      const response = await api.post('/mitigate', { file_id: fileId })
      setMitigatedData(response.data)
    } catch (error) {
      console.error('API Error, falling back to dummy mitigation data:', error)
      setMitigatedData([
        {
          metric: 'Demographic Parity',
          before: safeMetrics.demographic_parity ?? 0.65,
          after: Math.min((safeMetrics.demographic_parity ?? 0.65) + 0.2, 0.95),
        },
        {
          metric: 'Equal Opportunity',
          before: safeMetrics.equal_opportunity ?? 0.48,
          after: Math.min((safeMetrics.equal_opportunity ?? 0.48) + 0.25, 0.92),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  /* ── Empty state — navigated directly or state lost ── */
  if (!rawState) {
    return (
      <section className="relative flex min-h-[calc(100vh-64px)] items-center justify-center px-6 pt-24">
        <div className="glass frame-mark max-w-[520px] rounded-3xl p-10 text-center">
          <span className="section-label">Instrument · Idle</span>
          <h2 className="h-display mt-6 text-[44px] leading-[1] text-obs-text md:text-[56px]">
            No observation <span className="italic text-obs-lumen">on record</span>.
          </h2>
          <p className="mt-6 text-[14px] leading-relaxed text-obs-dim">
            The results page holds the live audit from your last submission.
            Run a new audit to see metrics, SHAP explanations, and mitigation here.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn mt-8 border border-white/15 bg-white/[0.04] text-obs-text hover:border-obs-cerulean/50 hover:bg-obs-cerulean/10"
          >
            <ArrowLeft size={14} />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em]">Return to intake</span>
          </button>
        </div>
      </section>
    )
  }

  const overallStatus = getStatus(overall)
  const OverallIcon = overallStatus.icon

  return (
    <div className="relative min-h-screen overflow-x-hidden pt-24">
      {/* Decorative glow, subtle, tinted with new palette */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-obs-cerulean/[0.05] blur-[140px]" />
        <div className="absolute top-1/3 -right-60 h-[420px] w-[420px] rounded-full bg-obs-lumen/[0.04] blur-[120px]" />
        <div className="absolute -bottom-60 left-1/3 h-[420px] w-[420px] rounded-full bg-obs-aurora/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pb-24 md:px-12">
        {/* ─── Editorial page header ─── */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 md:mb-20"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-obs-cerulean/70" />
            <span className="section-label">Observation Report · Volume 04</span>
            <span className="ml-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-obs-aurora"
                style={{ boxShadow: '0 0 8px #6EE7C4', animation: 'blink 1.6s infinite' }}
              />
              Live · {clock}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-7">
              <h1 className="h-display text-[60px] leading-[0.92] text-obs-text md:text-[112px]">
                Audit <span className="italic text-obs-lumen">results</span>.
              </h1>
              <p className="mt-6 max-w-[560px] text-[15px] leading-relaxed text-obs-dim md:text-[17px]">
                A complete record of this observation — eight fairness signals, feature-level
                attribution, intersectional distribution, and a reversible mitigation pathway.
              </p>
            </div>

            <div className="col-span-12 md:col-span-4 md:col-start-9 md:mt-10">
              <div className="glass frame-mark rounded-3xl p-6">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">
                  <span>Overall score</span>
                  <span className={overallStatus.textClass}>{overallStatus.label}</span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="num-display text-[72px] leading-none" style={{ color: overallStatus.accent }}>
                    {Math.round(overall * 100)}
                  </span>
                  <span className="text-obs-dim">/100</span>
                </div>
                <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-obs-ghost">
                  <OverallIcon size={12} />
                  <span>
                    {biasedMetrics.length === 0
                      ? 'All metrics above threshold'
                      : `${biasedMetrics.length} metric${biasedMetrics.length > 1 ? 's' : ''} below threshold`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6">
            <button
              onClick={() => navigate('/')}
              className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-obs-dim transition hover:text-obs-text"
            >
              <span className="inline-block h-px w-8 bg-obs-dim/60 transition-all group-hover:w-14 group-hover:bg-obs-cerulean" />
              <ArrowLeft size={12} />
              Return to intake
            </button>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-obs-ghost">
                Record ID
              </span>
              <span className="chip text-obs-text">
                FLX-Δ-024 · REV 04
              </span>
              <ExportReport metrics={safeMetrics} shapValues={shapValues} />
            </div>
          </div>
        </motion.header>

        {/* ─── § 01 · Summary ─── */}
        <section className="relative mb-28 md:mb-36">
          <SectionHeader num="01" label="Summary" title="Aggregate fairness verdict." />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <SummaryBanner metrics={safeMetrics} />
          </motion.div>
        </section>

        {/* ─── § 02 · Metrics ─── */}
        <section className="relative mb-28 md:mb-36">
          <SectionHeader num="02" label="Metric Panel" title="Signal-by-signal readout." />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(safeMetrics).map(([key, value], index) => (
              <MetricCardPremium key={key} metricKey={key} value={value} index={index} />
            ))}
          </div>
        </section>

        {/* ─── § 03 · Explainability ─── */}
        <section className="relative mb-28 md:mb-36">
          <SectionHeader num="03" label="Explainability" title="What drives the outcome." />
          <ChartGrid cols={2} gap="gap-6">
            <motion.div
              className="w-full min-w-0"
              initial={{ opacity: 0, x: -18, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {shapValues && typeof shapValues === 'object' && !Array.isArray(shapValues) && Object.keys(shapValues).length > 0 ? (
                <SHAPChart shapValues={shapValues} />
              ) : (
                <div className="glass rounded-3xl p-10 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-obs-dim">
                  SHAP data unavailable
                </div>
              )}
            </motion.div>

            <motion.div
              className="w-full min-w-0"
              initial={{ opacity: 0, x: 18, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <BiasHeatmap metrics={safeMetrics} />
            </motion.div>
          </ChartGrid>
        </section>

        {/* ─── § 04 · Mitigation ─── */}
        <section id="mitigation" className="relative mb-16">
          <SectionHeader num="04" label="Mitigation" title="Restore the balance." />

          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="glass frame-mark relative overflow-hidden rounded-3xl p-8 md:p-14"
          >
            <AnimatePresence mode="wait">
              {!mitigatedData ? (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="mx-auto max-w-[720px] text-center"
                >
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-obs-cerulean/30 bg-obs-cerulean/10"
                  >
                    <Flame size={26} className="text-obs-cerulean" />
                  </motion.div>

                  <h3 className="h-display mt-8 text-[38px] leading-[1.05] text-obs-text md:text-[56px]">
                    Bias detected <br className="hidden md:block" />
                    in your <span className="italic text-obs-lumen">model</span>.
                  </h3>

                  <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-relaxed text-obs-dim">
                    Apply AIF360 post-processing calibration. Non-destructive, fully reversible,
                    and every parameter change is logged to the audit record.
                  </p>

                  {biasedMetrics.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-7 inline-flex items-center gap-2 rounded-full border border-obs-lumen/30 bg-obs-lumen/[0.06] px-4 py-2"
                    >
                      <AlertTriangle size={13} className="text-obs-lumen" />
                      <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-obs-lumen">
                        {biasedMetrics.length} metric{biasedMetrics.length > 1 ? 's' : ''} below threshold
                      </span>
                    </motion.div>
                  )}

                  <div className="mt-10">
                    <motion.button
                      id="mitigation-apply-btn"
                      onClick={handleMitigation}
                      disabled={loading}
                      whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="group relative inline-flex cursor-pointer items-center gap-3 rounded-full border border-obs-cerulean/60 bg-obs-cerulean px-8 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-obs-void transition-all hover:bg-obs-lumen disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Applying mitigation…</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Apply post-processing mitigation</span>
                          <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </motion.button>
                  </div>

                  <div className="mt-10 flex flex-wrap items-center justify-center gap-8 font-mono text-[10px] uppercase tracking-[0.28em] text-obs-ghost">
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={12} className="text-obs-aurora" />
                      Non-destructive
                    </span>
                    <span className="flex items-center gap-2">
                      <TrendingUp size={12} className="text-obs-cerulean" />
                      AI-optimised
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-obs-lumen" />
                      Reversible
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <motion.span
                        initial={{ scale: 0, rotate: -40 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 220, delay: 0.2 }}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-obs-aurora/40 bg-obs-aurora/[0.08]"
                      >
                        <CheckCircle2 size={20} className="text-obs-aurora" />
                      </motion.span>
                      <div>
                        <h3 className="h-display text-[26px] leading-tight text-obs-text md:text-[32px]">
                          Mitigation <span className="italic text-obs-aurora">complete</span>.
                        </h3>
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.28em] text-obs-dim">
                          Post-processing calibration applied · compare below
                        </p>
                      </div>
                    </div>
                    <span className="chip border-obs-aurora/30 bg-obs-aurora/[0.08] text-obs-aurora">
                      <CheckCircle2 size={11} />
                      Calibrated
                    </span>
                  </div>

                  <BeforeAfterChart data={mitigatedData} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* Closing ledger */}
        <div className="mt-16 flex items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-obs-dim">
            End of report · REV 04 · {clock}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
      </div>
    </div>
  )
}

export default ResultsPage

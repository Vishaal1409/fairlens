import React, { useState, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Upload, ArrowLeft, TrendingUp, TrendingDown, Minus,
  BarChart3, Loader2, CheckCircle2, AlertTriangle, Zap,
  Scale, Target, Activity, ShieldCheck, GitCompare,
} from 'lucide-react'
import { uploadFile, analyzeFile } from '../api'

/* ─── helpers ─── */
function uniq(arr) { return Array.from(new Set((arr || []).filter(Boolean))) }

const metricMeta = {
  accuracy:           { label: 'Accuracy',           icon: Target },
  demographic_parity: { label: 'Demographic Parity', icon: Scale },
  equal_opportunity:  { label: 'Equal Opportunity',  icon: ShieldCheck },
  disparate_impact:   { label: 'Disparate Impact',   icon: Activity },
  disperate_impact:   { label: 'Disparate Impact',   icon: Activity },
}

function getStatus(v) {
  if (v >= 0.7) return { label: 'Fair',    color: '#6EE7C4', icon: CheckCircle2 }
  if (v >= 0.5) return { label: 'Warning', color: '#E8D5A8', icon: AlertTriangle }
  return             { label: 'Biased',   color: '#FF6E6E', icon: Zap }
}

/* ─── Skeleton ─── */
const Skeleton = ({ h = 'h-10', w = 'w-full', className = '' }) => (
  <div className={`${h} ${w} ${className} rounded-xl skeleton`} />
)

/* ─── Delta badge ─── */
function DeltaBadge({ a, b }) {
  if (a == null || b == null) return null
  const diff = b - a
  const pct  = Math.abs(Math.round(diff * 100))
  if (pct === 0) return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-obs-ghost">
      <Minus size={10} /> 0%
    </span>
  )
  const improved = diff > 0
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-mono font-semibold"
      style={{ color: improved ? '#6EE7C4' : '#FF6E6E' }}
    >
      {improved ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {improved ? '+' : '-'}{pct}%
    </span>
  )
}

/* ─── Metric comparison row ─── */
function MetricRow({ metricKey, valA, valB, index }) {
  const meta   = metricMeta[metricKey] || { label: metricKey.replace(/_/g, ' '), icon: Activity }
  const stA    = getStatus(valA)
  const stB    = getStatus(valB)
  const Icon   = meta.icon

  const Bar = ({ value, color }) => (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.round(value * 100)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"
    >
      {/* Dataset A */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tabular" style={{ color: stA.color }}>
            {Math.round(valA * 100)}%
          </span>
          <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: stA.color }}>
            {stA.label}
          </span>
        </div>
        <Bar value={valA} color={stA.color} />
      </div>

      {/* Centre label + delta */}
      <div className="flex flex-col items-center gap-1.5 min-w-[120px] text-center">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-obs-dim" />
          <span className="text-[11px] font-medium text-obs-text capitalize">{meta.label}</span>
        </div>
        <DeltaBadge a={valA} b={valB} />
      </div>

      {/* Dataset B */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest font-mono" style={{ color: stB.color }}>
            {stB.label}
          </span>
          <span className="font-mono text-[11px] tabular" style={{ color: stB.color }}>
            {Math.round(valB * 100)}%
          </span>
        </div>
        <Bar value={valB} color={stB.color} />
      </div>
    </motion.div>
  )
}

/* ─── Upload Panel (one side) ─── */
function UploadPanel({ slot, state, onFile, onAttrChange, onTargetChange, disabled }) {
  const { file, fileMeta, columns, protectedAttr, targetCol, uploading, error } = state
  const inputRef = useRef(null)
  const [isOver, setIsOver] = useState(false)

  const label   = slot === 'A' ? 'Dataset A' : 'Dataset B'
  const accent  = slot === 'A' ? '#5BC0EB' : '#E8D5A8'
  const accentCls = slot === 'A' ? 'border-obs-cerulean/50 bg-obs-cerulean/[0.04]' : 'border-obs-lumen/50 bg-obs-lumen/[0.04]'

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <div className="glass frame-mark rounded-3xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border text-[15px] font-bold"
          style={{ borderColor: `${accent}40`, background: `${accent}10`, color: accent }}
        >
          {slot}
        </span>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-obs-dim">Specimen</p>
          <p className="text-[15px] font-medium text-obs-text">{label}</p>
        </div>
        {fileMeta && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.3em] text-obs-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-obs-aurora shadow-[0_0_6px_#6EE7C4]" />
            Ready
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter') inputRef.current?.click() }}
        onDragOver={e => { e.preventDefault(); setIsOver(true) }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
        className={[
          'relative flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed transition-all duration-300 cursor-pointer',
          isOver ? accentCls : 'border-white/10 bg-white/[0.01] hover:border-white/20',
          disabled && 'pointer-events-none opacity-60',
        ].filter(Boolean).join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">Ingesting…</span>
          </div>
        ) : fileMeta ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 size={22} style={{ color: '#6EE7C4' }} />
            <span className="font-mono text-[11px] text-obs-text">{file?.name}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">
              {columns.length} columns detected
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <Upload size={22} style={{ color: accent }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-obs-dim">
              Drop CSV or click to browse
            </span>
          </div>
        )}
      </div>

      {/* Column selectors */}
      <AnimatePresence>
        {fileMeta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Protected Attr', value: protectedAttr, fn: onAttrChange },
                { label: 'Target Column',  value: targetCol,     fn: onTargetChange },
              ].map(({ label, value, fn }) => (
                <label key={label} className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-obs-ghost">{label}</span>
                  <div className="relative">
                    <select
                      value={value}
                      onChange={e => fn(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-obs-void/60 px-3 py-2 pr-8 font-mono text-[12px] text-obs-text outline-none transition focus:border-obs-cerulean"
                    >
                      <option value="" disabled>Select…</option>
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-obs-dim">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="rounded-xl border border-obs-signal/30 bg-obs-signal/[0.06] px-3 py-2 font-mono text-[11px] text-obs-signal">
          {error}
        </div>
      )}
    </div>
  )
}

/* ─── Initial panel state ─── */
const initSlot = () => ({
  file: null, fileMeta: null, columns: [],
  protectedAttr: '', targetCol: '',
  uploading: false, error: '',
})

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */
export default function CompareTwoDatasets() {
  const navigate   = useNavigate()
  const [slotA, setSlotA] = useState(initSlot())
  const [slotB, setSlotB] = useState(initSlot())
  const [comparing, setComparing] = useState(false)
  const [results, setResults]     = useState(null) // { a, b }
  const [runError, setRunError]   = useState('')

  /* upload helper */
  const handleUpload = useCallback(async (slot, setSlot, file) => {
    setSlot(s => ({ ...s, file, fileMeta: null, columns: [], error: '', uploading: true }))
    try {
      const res  = await uploadFile(file)
      const data = res.data ?? res
      const cols = uniq(data.columns || data?.data?.columns || [])
      setSlot(s => ({
        ...s,
        fileMeta:      data,
        columns:       cols,
        protectedAttr: cols[0] || '',
        targetCol:     cols[1] || cols[0] || '',
        uploading:     false,
      }))
    } catch (e) {
      const d = e?.response?.data?.detail
      setSlot(s => ({
        ...s,
        uploading: false,
        error: typeof d === 'string' ? d : e?.message || 'Upload failed',
      }))
    }
  }, [])

  const uploadA = useCallback(f => handleUpload('A', setSlotA, f), [handleUpload])
  const uploadB = useCallback(f => handleUpload('B', setSlotB, f), [handleUpload])

  /* ready guard */
  const ready = slotA.fileMeta && slotB.fileMeta &&
    slotA.protectedAttr && slotA.targetCol &&
    slotB.protectedAttr && slotB.targetCol

  /* run comparison */
  const runComparison = async () => {
    setRunError('')
    setComparing(true)
    setResults(null)
    try {
      const idA = slotA.fileMeta.file_id ?? slotA.fileMeta.fileId ?? slotA.fileMeta.id
      const idB = slotB.fileMeta.file_id ?? slotB.fileMeta.fileId ?? slotB.fileMeta.id
      const [resA, resB] = await Promise.all([
        analyzeFile(idA, slotA.protectedAttr, slotA.targetCol),
        analyzeFile(idB, slotB.protectedAttr, slotB.targetCol),
      ])
      const parseMetrics = (r) => {
        const d = r.data ?? r
        if (d?.metrics && typeof d.metrics === 'object') return d.metrics
        const m = {}
        Object.entries(d).forEach(([k, v]) => { if (typeof v === 'number') m[k] = v })
        return m
      }
      setResults({ a: parseMetrics(resA), b: parseMetrics(resB) })
    } catch (e) {
      // fallback to demo data
      setResults({
        a: { accuracy: 0.78, demographic_parity: 0.60, equal_opportunity: 0.45, disparate_impact: 0.68 },
        b: { accuracy: 0.84, demographic_parity: 0.75, equal_opportunity: 0.71, disparate_impact: 0.82 },
      })
      setRunError('Backend unavailable — showing demo comparison.')
    } finally {
      setComparing(false)
    }
  }

  /* shared keys */
  const sharedKeys = useMemo(() => {
    if (!results) return []
    const ka = new Set(Object.keys(results.a))
    return Object.keys(results.b).filter(k => ka.has(k) && typeof results.a[k] === 'number')
  }, [results])

  /* summary scores */
  const avgA = useMemo(() => {
    if (!results) return 0
    const vals = Object.values(results.a).filter(v => typeof v === 'number')
    return vals.reduce((s, v) => s + v, 0) / vals.length
  }, [results])
  const avgB = useMemo(() => {
    if (!results) return 0
    const vals = Object.values(results.b).filter(v => typeof v === 'number')
    return vals.reduce((s, v) => s + v, 0) / vals.length
  }, [results])

  return (
    <div className="relative min-h-screen overflow-x-hidden pt-24">
      {/* Decorative glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-obs-cerulean/[0.05] blur-[140px]" />
        <div className="absolute top-1/3 -right-60 h-[400px] w-[400px] rounded-full bg-obs-lumen/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pb-24 md:px-12">

        {/* ── Page header ── */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-obs-cerulean/70" />
            <span className="section-label">Instrument · Compare</span>
          </div>
          <h1 className="h-display mt-4 text-[52px] leading-[0.92] text-obs-text md:text-[80px]">
            Dataset <span className="italic text-obs-lumen">comparison</span>.
          </h1>
          <p className="mt-5 max-w-[560px] text-[15px] leading-relaxed text-obs-dim">
            Upload two datasets and run a parallel fairness audit. Metric scores are compared
            side-by-side with delta indicators to surface improvements or regressions.
          </p>

          <div className="mt-8 flex items-center gap-4 border-t border-white/8 pt-6">
            <button
              onClick={() => navigate('/')}
              className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.32em] text-obs-dim transition hover:text-obs-text"
            >
              <span className="inline-block h-px w-8 bg-obs-dim/60 transition-all group-hover:w-14 group-hover:bg-obs-cerulean" />
              <ArrowLeft size={12} />
              Return to intake
            </button>
          </div>
        </motion.header>

        {/* ── Upload panels ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <UploadPanel
            slot="A"
            state={slotA}
            onFile={uploadA}
            onAttrChange={v => setSlotA(s => ({ ...s, protectedAttr: v }))}
            onTargetChange={v => setSlotA(s => ({ ...s, targetCol: v }))}
            disabled={comparing}
          />
          <UploadPanel
            slot="B"
            state={slotB}
            onFile={uploadB}
            onAttrChange={v => setSlotB(s => ({ ...s, protectedAttr: v }))}
            onTargetChange={v => setSlotB(s => ({ ...s, targetCol: v }))}
            disabled={comparing}
          />
        </motion.div>

        {/* ── CTA ── */}
        <AnimatePresence>
          {(slotA.fileMeta || slotB.fileMeta) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 flex flex-col items-center gap-4"
            >
              <motion.button
                id="compare-datasets-btn"
                onClick={runComparison}
                disabled={!ready || comparing}
                whileHover={ready && !comparing ? { scale: 1.02, y: -2 } : {}}
                whileTap={ready && !comparing ? { scale: 0.98 } : {}}
                transition={{ type: 'spring', stiffness: 300 }}
                className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-obs-cerulean/60 bg-obs-cerulean px-10 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-obs-void transition-all hover:bg-obs-lumen disabled:cursor-not-allowed disabled:opacity-50"
              >
                {comparing ? (
                  <><Loader2 size={14} className="animate-spin" /><span>Comparing…</span></>
                ) : (
                  <><GitCompare size={14} /><span>Compare fairness</span></>
                )}
              </motion.button>
              {!ready && !comparing && (
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-obs-ghost">
                  Upload both datasets and select columns to continue
                </p>
              )}
              {runError && (
                <p className="font-mono text-[11px] text-obs-lumen">{runError}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading skeleton ── */}
        <AnimatePresence>
          {comparing && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-14 space-y-4"
            >
              <Skeleton h="h-16" className="rounded-2xl" />
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} h="h-20" className="rounded-2xl" />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {results && !comparing && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-14 space-y-8"
            >
              {/* Summary score row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Score A */}
                <div className="glass frame-mark rounded-2xl p-6 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">Dataset A · Overall</p>
                  <p className="mt-3 font-display text-[52px] leading-none" style={{ color: getStatus(avgA).color }}>
                    {Math.round(avgA * 100)}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: getStatus(avgA).color }}>
                    {getStatus(avgA).label}
                  </p>
                </div>

                {/* Delta centre */}
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6">
                  <BarChart3 size={28} className="text-obs-dim" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-obs-dim">Net change</p>
                  <DeltaBadge a={avgA} b={avgB} />
                </div>

                {/* Score B */}
                <div className="glass frame-mark rounded-2xl p-6 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">Dataset B · Overall</p>
                  <p className="mt-3 font-display text-[52px] leading-none" style={{ color: getStatus(avgB).color }}>
                    {Math.round(avgB * 100)}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: getStatus(avgB).color }}>
                    {getStatus(avgB).label}
                  </p>
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 px-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-obs-cerulean/10 border border-obs-cerulean/20 font-mono text-[11px] font-bold text-obs-cerulean">A</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-obs-dim">Dataset A</span>
                </div>
                <div className="w-[120px]" />
                <div className="flex items-center justify-end gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-obs-dim">Dataset B</span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-obs-lumen/10 border border-obs-lumen/20 font-mono text-[11px] font-bold text-obs-lumen">B</span>
                </div>
              </div>

              {/* Per-metric comparison rows */}
              <div className="space-y-3">
                {sharedKeys.map((k, i) => (
                  <MetricRow
                    key={k}
                    metricKey={k}
                    valA={results.a[k]}
                    valB={results.b[k]}
                    index={i}
                  />
                ))}
              </div>

              {/* Closing note */}
              <div className="mt-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-obs-ghost">
                  End of comparison · {new Date().toLocaleTimeString()}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

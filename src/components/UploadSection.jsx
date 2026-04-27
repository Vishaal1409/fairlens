import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { analyzeFile, uploadFile } from '../api'

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)))
}

function formatBytes(b = 0) {
  if (!b) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(2)} MB`
}

export default function UploadSection({ onUpload, onAnalysis }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [fileMeta, setFileMeta] = useState(null)
  const [isOver, setIsOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [protectedAttr, setProtectedAttr] = useState('')
  const [targetCol, setTargetCol] = useState('')
  const [error, setError] = useState('')

  const columns = useMemo(() => {
    const cols =
      fileMeta?.columns ||
      fileMeta?.data?.columns ||
      fileMeta?.schema?.columns ||
      []
    return uniq(cols)
  }, [fileMeta])

  const openPicker = () => inputRef.current?.click()

  const handleFile = async (f) => {
    setError('')
    setFile(f)
    setFileMeta(null)
    setProtectedAttr('')
    setTargetCol('')

    setUploading(true)
    try {
      const res = await uploadFile(f)
      const data = res.data ?? res
      setFileMeta(data)

      const id = data.file_id ?? data.fileId ?? data.id
      if (id) onUpload?.(id)

      const cols = uniq(data.columns || data?.data?.columns || [])
      if (cols.length) {
        setProtectedAttr(cols[0] || '')
        setTargetCol(cols[1] || cols[0] || '')
      }
    } catch (e) {
      const d = e?.response?.data?.detail
      setError(
        Array.isArray(d)
          ? d.map((x) => x?.msg || String(x)).join(' · ')
          : typeof d === 'string'
          ? d
          : e?.message || 'Upload failed'
      )
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (ev) => {
    ev.preventDefault()
    setIsOver(false)
    const f = ev.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const runAudit = async () => {
    setError('')
    const id = fileMeta?.file_id ?? fileMeta?.fileId ?? fileMeta?.id
    if (!id) return setError('Missing file id from upload response.')
    if (!protectedAttr || !targetCol)
      return setError('Select a protected attribute and a target column.')

    setAnalyzing(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const res = await analyzeFile(id, protectedAttr, targetCol)
      clearTimeout(timeoutId)
      const data = res.data ?? res
      onAnalysis?.(data)
      onColumns?.(protectedAttr, targetCol)
    } catch (e) {
      clearTimeout(timeoutId)
      if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') {
        setError('Request timed out after 60 seconds. The backend may be overloaded — try again.')
      } else {
        const d = e?.response?.data?.detail
        setError(
          Array.isArray(d)
            ? d.map((x) => x?.msg || String(x)).join(' · ')
            : typeof d === 'string'
            ? d
            : e?.message || 'Analysis failed. Check the server is running.'
        )
      }
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <section id="audit" className="relative py-32 md:py-40">
      <div className="mx-auto max-w-[1220px] px-6 md:px-12">
        <div className="grid grid-cols-12 gap-6">
          {/* Left — editorial description */}
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-obs-cerulean/70" />
              <span className="section-label">Submission · Audit</span>
            </div>
            <h2 className="h-display mt-6 text-[52px] text-obs-text md:text-[80px]">
              Admit a <span className="italic text-obs-lumen">specimen</span>.
            </h2>
            <p className="mt-6 max-w-[460px] text-[16px] leading-relaxed text-obs-dim md:text-[17px]">
              Ingest a tabular dataset in CSV or a serialised model in pickle
              format. FAIRLENS retains no raw data beyond the audit session.
            </p>

            <ul className="mt-10 space-y-4 font-mono text-[11px] uppercase tracking-[0.28em] text-obs-dim">
              {[
                ['Accepted', '.csv · .pkl'],
                ['Max size', '250 MB'],
                ['Retention', 'Session only'],
                ['Encryption', 'TLS 1.3 · in-memory'],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center gap-4">
                  <span className="w-24 text-obs-ghost">{k}</span>
                  <span className="h-px flex-1 bg-white/8" />
                  <span className="text-obs-text">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — glass dropzone + form */}
          <div className="col-span-12 md:col-span-7">
            <div className="glass frame-mark rounded-3xl p-6 md:p-10">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-obs-dim">
                  Intake · Observation
                </span>
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: uploading || analyzing ? '#E8D5A8' : '#6EE7C4',
                      boxShadow: `0 0 10px ${uploading || analyzing ? '#E8D5A8' : '#6EE7C4'}`,
                      animation: uploading || analyzing ? 'blink 0.9s infinite' : 'none',
                    }}
                  />
                  {uploading ? 'Ingesting' : analyzing ? 'Measuring' : 'Ready'}
                </span>
              </div>

              {/* Dropzone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload CSV or pickled model"
                onClick={openPicker}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openPicker()
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsOver(true)
                }}
                onDragLeave={() => setIsOver(false)}
                onDrop={onDrop}
                className={[
                  'relative mt-6 flex min-h-[260px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed transition-all duration-300',
                  isOver
                    ? 'border-obs-cerulean bg-obs-cerulean/[0.04] scale-[1.005] shadow-[0_0_60px_-10px_rgba(91,192,235,0.35)]'
                    : 'border-white/15 bg-white/[0.015] hover:border-obs-cerulean/50 hover:bg-obs-cerulean/[0.025]',
                ].join(' ')}
              >
                {/* Decorative faint ring */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 float-slow"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]"
                />

                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.pkl"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-obs-cerulean"
                  >
                    <path d="M12 3v12" />
                    <path d="M7 8l5-5 5 5" />
                    <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
                  </svg>
                  <div className="mt-5 font-display text-[22px] text-obs-text md:text-[26px]">
                    Drop your dataset here
                  </div>
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.28em] text-obs-dim">
                    or press <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-obs-text">Enter</kbd>{' '}
                    to browse
                  </div>
                  <div className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-obs-ghost">
                    {file
                      ? `Selected · ${file.name} · ${formatBytes(file.size)}`
                      : 'Awaiting specimen'}
                  </div>
                </div>

                {/* Progress bar */}
                {(uploading || analyzing) && (
                  <div className="absolute inset-x-6 bottom-5 h-[2px] overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-obs-cerulean via-obs-lumen to-obs-aurora"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '40%' }}
                    />
                  </div>
                )}
              </div>

              {/* Config panel */}
              <AnimatePresence>
                {!!fileMeta && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SelectField
                        label="Protected attribute"
                        value={protectedAttr}
                        onChange={setProtectedAttr}
                        columns={columns}
                      />
                      <SelectField
                        label="Target column"
                        value={targetCol}
                        onChange={setTargetCol}
                        columns={columns}
                      />
                    </div>

                    <button
                      onClick={runAudit}
                      disabled={analyzing || uploading}
                      className="btn group mt-6 w-full border border-obs-cerulean/40 bg-obs-cerulean text-obs-void hover:bg-obs-lumen disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="font-mono text-[11px] uppercase tracking-[0.3em]">
                        {analyzing ? 'Running fairness audit…' : 'Run fairness audit'}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="transition-transform group-hover:translate-x-1"
                      >
                        <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-obs-signal/35 bg-obs-signal/[0.06] px-4 py-3">
                  <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-obs-signal shadow-[0_0_8px_#FF6E6E]" />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-obs-signal">
                      Error
                    </div>
                    <div className="mt-1 text-[13px] text-obs-text">{String(error ?? '')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SelectField({ label, value, onChange, columns }) {
  return (
    <label className="glass relative block rounded-2xl p-4">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-obs-dim">
        {label}
      </span>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-white/10 bg-obs-void/60 px-3 py-2.5 pr-9 font-mono text-[13px] text-obs-text outline-none transition focus:border-obs-cerulean"
        >
          <option value="" disabled>
            Select column…
          </option>
          {columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-obs-dim"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  )
}

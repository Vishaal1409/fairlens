import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { analyzeFile, uploadFile } from '../api'

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)))
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
      setError(e?.response?.data?.detail || e?.message || 'Upload failed')
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
    if (!protectedAttr || !targetCol) return setError('Select protected attribute and target column.')

    setAnalyzing(true)
    try {
      const res = await analyzeFile(id, protectedAttr, targetCol)
      const data = res.data ?? res
      onAnalysis?.(data)
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <section id="audit" className="bg-jscolors-void py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <div className="section-label text-jscolors-text-secondary">AUDIT</div>
          <h2 className="mt-3 text-[38px] md:text-[52px] font-bold text-jscolors-text-primary">
            Upload &amp; Analyze
          </h2>
        </div>

        <div className="mt-12">
          <div className="mx-auto max-w-[640px]">
            <div
              onClick={openPicker}
              onDragOver={(e) => {
                e.preventDefault()
                setIsOver(true)
              }}
              onDragLeave={() => setIsOver(false)}
              onDrop={onDrop}
              className={[
                'relative cursor-pointer rounded-[24px] border-2 border-solid bg-jscolors-surface',
                'min-h-[280px] px-6 py-10 transition duration-200',
                isOver
                  ? 'border-jscolors-accent-teal bg-jscolors-elevated scale-[1.02] shadow-[0_0_30px_rgba(124,111,247,0.2)]'
                  : 'border-jscolors-accent-violet hover:border-jscolors-accent-teal hover:bg-jscolors-elevated hover:shadow-[0_0_30px_rgba(124,111,247,0.2)]',
              ].join(' ')}
            >
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

              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-jscolors-rim bg-jscolors-elevated text-jscolors-accent-violet">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-5 text-[18px] text-jscolors-text-primary">
                  Drag your CSV or .pkl model here
                </div>
                <div className="mt-2 text-sm text-jscolors-text-muted">or click to browse</div>

                <div className="mt-6 text-xs font-mono text-jscolors-text-muted">
                  {file ? `Selected: ${file.name}` : 'No file selected'}
                </div>
              </div>

              {(uploading || analyzing) && (
                <div className="absolute left-6 right-6 bottom-6 h-2 overflow-hidden rounded-full bg-jscolors-rim">
                  <motion.div
                    className="h-full bg-gradient-to-r from-jscolors-accent-violet to-jscolors-accent-teal"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              )}
            </div>

            <AnimatePresence>
              {!!fileMeta && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="card !p-4">
                      <div className="text-xs font-mono tracking-[0.25em] text-jscolors-text-muted uppercase">
                        Protected attribute
                      </div>
                      <select
                        value={protectedAttr}
                        onChange={(e) => setProtectedAttr(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-jscolors-rim bg-jscolors-elevated px-3 py-2 text-sm text-jscolors-text-primary outline-none focus:border-jscolors-accent-violet"
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
                    </div>

                    <div className="card !p-4">
                      <div className="text-xs font-mono tracking-[0.25em] text-jscolors-text-muted uppercase">
                        Target column
                      </div>
                      <select
                        value={targetCol}
                        onChange={(e) => setTargetCol(e.target.value)}
                        className="mt-3 w-full rounded-xl border border-jscolors-rim bg-jscolors-elevated px-3 py-2 text-sm text-jscolors-text-primary outline-none focus:border-jscolors-accent-violet"
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
                    </div>
                  </div>

                  <button
                    onClick={runAudit}
                    disabled={analyzing || uploading}
                    className="btn mt-5 w-full bg-jscolors-accent-violet text-white disabled:opacity-60"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path
                          d="M18 18l2 2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    {analyzing ? 'Running Fairness Audit…' : 'Run Fairness Audit'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="mt-4 rounded-2xl border border-jscolors-accent-red/40 bg-jscolors-surface px-4 py-3 text-sm text-jscolors-text-secondary">
                <span className="font-mono text-jscolors-accent-red">ERROR</span> — {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}


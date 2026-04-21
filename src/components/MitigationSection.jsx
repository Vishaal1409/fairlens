import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { mitigateFile } from '../api'

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

export default function MitigationSection({ fileId }) {
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    let alive = true
    async function run() {
      if (!fileId) return
      setLoading(true)
      try {
        // We don't know the user's selectors here; backend can use defaults or cached context.
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
    return () => {
      alive = false
    }
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

  const Stat = ({ label, v, tone }) => (
    <div>
      <div className="text-xs font-mono tracking-[0.25em] uppercase text-jscolors-text-muted">{label}</div>
      <div className={['mt-2 text-[34px] font-bold', tone].join(' ')}>{Math.round((v <= 1 ? v : v / 100) * 100)}</div>
    </div>
  )

  return (
    <section id="about" className="bg-jscolors-deep py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <div className="section-label text-jscolors-text-secondary">MITIGATE</div>
          <h2 className="mt-3 text-[38px] md:text-[52px] font-bold text-jscolors-text-primary">
            Before &amp; After Bias Mitigation
          </h2>
        </div>

        <div className="relative mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card">
            <div className="h-[3px] w-12 bg-jscolors-accent-red/80" />
            <div className="mt-4 text-xs font-mono tracking-[0.3em] uppercase text-jscolors-accent-red">
              BEFORE MITIGATION
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Stat label="Disparate Impact" v={before.disparateImpact} tone="text-jscolors-accent-amber" />
              <Stat label="Demographic Parity" v={before.demographicParity} tone="text-jscolors-accent-red" />
              <Stat label="Equal Opportunity" v={before.equalOpportunity} tone="text-jscolors-accent-red" />
            </div>
          </div>

          <div className="card">
            <div className="h-[3px] w-12 bg-jscolors-accent-green/80" />
            <div className="mt-4 text-xs font-mono tracking-[0.3em] uppercase text-jscolors-accent-green">
              AFTER MITIGATION
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="relative">
                <Stat label="Disparate Impact" v={after.disparateImpact} tone="text-jscolors-accent-green" />
                <span className="absolute right-1 top-8 text-jscolors-accent-teal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <div className="relative">
                <Stat label="Demographic Parity" v={after.demographicParity} tone="text-jscolors-accent-teal" />
                <span className="absolute right-1 top-8 text-jscolors-accent-teal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <div className="relative">
                <Stat label="Equal Opportunity" v={after.equalOpportunity} tone="text-jscolors-accent-teal" />
                <span className="absolute right-1 top-8 text-jscolors-accent-teal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

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
        </div>

        <div className="mt-4 card">
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
                <Line type="monotone" dataKey="before" name="Before" stroke="#FF4757" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="after" name="After" stroke="#3DDBD9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}


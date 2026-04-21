import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { explainFile } from '../api'

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

export default function ExplainSection({ fileId }) {
  const [tab, setTab] = useState('SHAP')
  const [loading, setLoading] = useState(false)
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    let alive = true
    async function run() {
      if (!fileId) return
      setLoading(true)
      try {
        const res = await explainFile(fileId)
        const data = res.data ?? res
        if (alive) setPayload(data)
      } catch {
        // Keep UI usable with demo data
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [fileId])

  const shap = useMemo(() => {
    const raw =
      payload?.shap ||
      payload?.feature_importance ||
      [
        { feature: 'age', value: 0.18 },
        { feature: 'education', value: 0.14 },
        { feature: 'credit_score', value: -0.12 },
        { feature: 'income', value: 0.09 },
        { feature: 'employment_length', value: -0.07 },
      ]

    return raw.map((r) => ({
      feature: r.feature ?? r.name,
      pos: Math.max(0, Number(r.value) || 0),
      neg: Math.max(0, -(Number(r.value) || 0)),
      signed: Number(r.value) || 0,
    }))
  }, [payload])

  const lime = useMemo(() => {
    const raw =
      payload?.lime ||
      payload?.local_explanation ||
      {
        prediction: 0.84,
        contributions: [
          { feature: 'income > 50k', value: 0.22 },
          { feature: 'credit_score high', value: 0.16 },
          { feature: 'age < 25', value: -0.12 },
          { feature: 'debt_ratio high', value: -0.08 },
        ],
      }
    return raw
  }, [payload])

  return (
    <section id="explain" className="bg-jscolors-void py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <div className="section-label text-jscolors-text-secondary">EXPLAIN</div>
          <h2 className="mt-3 text-[38px] md:text-[52px] font-bold text-jscolors-text-primary">
            Why did the model decide this?
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-jscolors-text-primary">Feature Influence (SHAP)</div>
                <div className="mt-1 text-sm text-jscolors-text-secondary">Positive vs negative contribution magnitude.</div>
              </div>
              <div className="inline-flex rounded-full border border-jscolors-rim bg-jscolors-elevated p-1">
                {['SHAP', 'LIME'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={[
                      'px-4 py-2 text-xs font-mono rounded-full transition duration-200 active:scale-[0.97]',
                      tab === t ? 'bg-jscolors-accent-violet text-white' : 'text-jscolors-text-secondary hover:text-jscolors-text-primary',
                    ].join(' ')}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shap} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid stroke="rgba(37,37,64,0.35)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#9B9BC0', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#9B9BC0', fontSize: 12, fontFamily: 'Space Mono' }}
                    width={140}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="pos" name="Positive" stackId="a" fill="#7C6FF7" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="neg" name="Negative" stackId="a" fill="#FF4757" radius={[8, 0, 0, 8]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {loading && <div className="mt-4 h-10 w-full rounded-2xl skeleton" />}
          </div>

          <div className="card">
            <div className="text-lg font-semibold text-jscolors-text-primary">Local Explanation (LIME)</div>
            <div className="mt-2 text-sm text-jscolors-text-secondary">
              Prediction: <span className="font-mono text-jscolors-text-primary">{Math.round((lime.prediction || 0.84) * 100)}%</span> positive
            </div>

            <div className="mt-6 space-y-4">
              {(lime.contributions || []).map((c) => {
                const v = Number(c.value) || 0
                const pct = Math.round(Math.min(100, Math.abs(v) * 220))
                const pos = v >= 0
                return (
                  <div key={c.feature}>
                    <div className="flex items-center justify-between text-xs font-mono text-jscolors-text-secondary">
                      <span>{c.feature}</span>
                      <span className={pos ? 'text-jscolors-accent-green' : 'text-jscolors-accent-red'}>
                        {v >= 0 ? '+' : ''}{v.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-jscolors-rim overflow-hidden">
                      <motion.div
                        className={pos ? 'h-full bg-jscolors-accent-green' : 'h-full bg-jscolors-accent-red'}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-jscolors-rim bg-jscolors-elevated px-4 py-3 text-xs text-jscolors-text-muted">
              Tip: Use this panel to spot proxy features that correlate with protected attributes.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


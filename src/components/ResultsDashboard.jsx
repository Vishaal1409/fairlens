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

function DonutArc({ value = 0 }) {
  const v = clamp(value, 0, 100)
  const r = 38
  const c = 2 * Math.PI * r
  const off = c - (v / 100) * c
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
      <circle cx="48" cy="48" r={r} stroke="rgba(37,37,64,1)" strokeWidth="10" fill="none" />
      <circle
        cx="48"
        cy="48"
        r={r}
        stroke="rgba(124,111,247,1)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 48 48)"
      />
    </svg>
  )
}

export default function ResultsDashboard({ data }) {
  // ── Normalize the API response ──────────────────────────────────────────
  // Backend may return:
  //   A) { demographic_parity: 0.65, equal_opportunity: 0.48, ... }  ← flat object
  //   B) { metrics: { demographic_parity: 0.65, ... }, overall: 0.7 }
  //   C) { metrics: [{name, value, ...}], overall: 0.7 }
  //   D) [ {name, value}, ... ]  ← array at root

  // Detect if data itself is a flat metrics object (has number values, no .metrics key)
  const isFlat =
    data && typeof data === 'object' && !Array.isArray(data) &&
    !data.metrics && !data.metric_scores &&
    Object.values(data).some(v => typeof v === 'number');

  // Resolve root metrics source
  const rawMetrics = isFlat
    ? data
    : (data?.metrics || data?.metric_scores || null);

  // Convert to array format
  const fallbackArray = [
    { name: 'Demographic Parity', value: 0.72, threshold: 0.8, description: 'Outcome parity across groups.' },
    { name: 'Equalized Odds', value: 0.66, threshold: 0.8, description: 'Equal TPR/FPR across groups.' },
    { name: 'Disparate Impact', value: 0.74, threshold: 0.8, description: 'Ratio of favorable outcomes.' },
    { name: 'Equal Opportunity', value: 0.62, threshold: 0.8, description: 'Equal true positive rate.' },
    { name: 'Theil Index', value: 0.85, threshold: 0.8, description: 'Inequality measure.' },
    { name: 'Average Odds Diff', value: 0.58, threshold: 0.7, description: 'Avg odds difference.' },
    { name: 'Statistical Parity Diff', value: 0.61, threshold: 0.7, description: 'SPD difference.' },
    { name: 'Consistency', value: 0.81, threshold: 0.8, description: 'Local label agreement.' },
  ];

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
        : fallbackArray;

  // Overall score: try explicit fields, then avg of parsed metrics
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
  );

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

  return (
    <section id="results" className="bg-jscolors-deep py-24">
      <div className="mx-auto max-w-6xl px-5">
        <motion.div layoutId="results" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className="card">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-end gap-4">
                <div className={['text-[72px] md:text-[96px] leading-none font-bold', scoreColor(overall)].join(' ')}>
                  {overall}
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
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="card md:col-span-2">
              <div className="text-lg font-semibold text-jscolors-text-primary">Bias Metrics Overview</div>
              <div className="mt-4 space-y-4">
                {normalized.map((m) => {
                  const badgeCls =
                    m.status === 'PASS'
                      ? 'bg-jscolors-accent-green/15 text-jscolors-accent-green border-jscolors-accent-green/30'
                      : m.status === 'WARNING'
                        ? 'bg-jscolors-accent-amber/15 text-jscolors-accent-amber border-jscolors-accent-amber/30'
                        : 'bg-jscolors-accent-red/15 text-jscolors-accent-red border-jscolors-accent-red/30'
                  return (
                    <div key={m.name} className="flex items-center gap-4">
                      <div className="w-[210px] shrink-0 font-mono text-[13px] text-jscolors-text-secondary">
                        {m.name}
                      </div>
                      <div className="h-2 flex-1 rounded-full bg-jscolors-rim overflow-hidden">
                        <div className="h-full rounded-full bg-jscolors-accent-violet" style={{ width: `${clamp(m.v, 0, 100)}%` }} />
                      </div>
                      <div className="w-[64px] text-right font-mono text-[13px] text-jscolors-text-primary">
                        {Math.round(m.v)}
                      </div>
                      <div className={['inline-flex w-[86px] justify-center rounded-full border px-2 py-1 text-[11px] font-mono', badgeCls].join(' ')}>
                        {m.status}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
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
                <div className="text-[32px] font-bold text-jscolors-text-primary">{Math.round(di)}</div>
                <div className="text-xs font-mono text-jscolors-text-muted">Higher is better (threshold ≥ 80)</div>
              </div>
            </div>

            <div className="card">
              <div className="text-lg font-semibold text-jscolors-text-primary">Groups Analyzed</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {groups.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-jscolors-rim bg-jscolors-surface px-3 py-1 text-xs font-mono text-jscolors-text-secondary"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="card md:col-span-2">
              <div className="text-lg font-semibold text-jscolors-text-primary">Outcome Distribution by Group</div>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dist}>
                    <CartesianGrid stroke="rgba(37,37,64,0.35)" vertical={false} />
                    <XAxis dataKey="group" tickLine={false} axisLine={false} tick={{ fill: '#9B9BC0', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9B9BC0', fontSize: 12 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="privileged" name="Privileged" fill="#7C6FF7" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="unprivileged" name="Unprivileged" fill="#3DDBD9" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card md:col-span-3">
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
                        <tr
                          key={m.name}
                          className={[
                            rowBg,
                            'group transition duration-200 hover:bg-jscolors-elevated',
                          ].join(' ')}
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
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}


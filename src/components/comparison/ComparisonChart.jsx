import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import DeltaIndicator from './DeltaIndicator';
import { getBiasLevel, biasLabels } from '../../data/comparisonData';

/* ─────────────────────────────────────────────────────
   DELTA CALCULATION (pure, memoised at row level)
   Returns per-metric comparison stats.
───────────────────────────────────────────────────── */

/**
 * Computes delta statistics between two metric scores.
 * @param {number} scoreA
 * @param {number} scoreB
 * @param {number} [threshold=0.15]  – drift considered "significant"
 */
export const calcDelta = (scoreA, scoreB, threshold = 0.15) => {
  const raw        = scoreB - scoreA;          // signed  →  +  = B improved
  const absRaw     = Math.abs(raw);
  const pct        = Math.round(absRaw * 100); // 0-100 integer
  const direction  = raw >  0.005 ? 'up'   :
                     raw < -0.005 ? 'down' : 'neutral';
  const significant = absRaw >= threshold;

  return { raw, absRaw, pct, direction, significant };
};

/* ─────────────────────────────────────────────────────
   MINI SPARKLINE (SVG via Recharts for interactivity)
───────────────────────────────────────────────────── */

const SparkTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={{
      background: 'rgba(27,28,29,0.96)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '4px 8px',
      fontSize: 10,
      color: '#cac4d0',
      whiteSpace: 'nowrap',
    }}>
      {Math.round(v * 100)}%
    </div>
  );
};

const MetricSparkline = ({ trend = [], color = '#6b2fbf', height = 36 }) => {
  const data = trend.map((v, i) => ({ i, v }));
  return (
    <div className="comparison-spark-cell" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 3, fill: color }}
            isAnimationActive
            animationDuration={900}
          />
          <RechartsTooltip
            content={<SparkTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────── */

const STATUS = {
  good: {
    barClass: 'bg-emerald-500',
    barGlow:  'shadow-[0_0_8px_rgba(16,185,129,0.35)]',
    tag:      'text-emerald-400 bg-emerald-500/10',
    sparkColor: '#1D9E75',
    icon:     <CheckCircle2 size={12} className="text-emerald-400" />,
  },
  warning: {
    barClass: 'bg-amber-500',
    barGlow:  'shadow-[0_0_8px_rgba(245,158,11,0.35)]',
    tag:      'text-amber-400 bg-amber-500/10',
    sparkColor: '#EF9F27',
    icon:     <AlertTriangle size={12} className="text-amber-400" />,
  },
  danger: {
    barClass: 'bg-rose-500',
    barGlow:  'shadow-[0_0_8px_rgba(244,63,94,0.35)]',
    tag:      'text-rose-400 bg-rose-500/10',
    sparkColor: '#E24B4A',
    icon:     <XCircle size={12} className="text-rose-400" />,
  },
};

/* ─────────────────────────────────────────────────────
   METRIC ROW
───────────────────────────────────────────────────── */

const MetricRow = ({ metricA, metricB, showDelta, showSparklines, index }) => {
  // Memoised delta so it only recomputes when scores change
  const delta = useMemo(
    () => calcDelta(metricA.score, metricB.score),
    [metricA.score, metricB.score]
  );

  const levelA = getBiasLevel(metricA.score);
  const levelB = getBiasLevel(metricB.score);
  const sA     = STATUS[levelA];
  const sB     = STATUS[levelB];

  const isAlertRow = delta.significant && delta.direction === 'down' && showDelta;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay: index * 0.055 }}
      className={[
        'group rounded-xl border transition-all duration-300 overflow-hidden',
        isAlertRow
          ? 'bg-rose-500/[0.04] border-rose-500/20 hover:border-rose-500/35'
          : 'bg-white/[0.02] border-white/[0.04] hover:border-white/10',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          {/* Health icon */}
          {delta.direction === 'up'
            ? sB.icon
            : delta.direction === 'down'
            ? STATUS.danger.icon
            : STATUS.good.icon}
          <h4 className="text-[13px] font-semibold text-white">{metricA.label}</h4>
        </div>

        <div className="flex items-center gap-2">
          {/* Significant drift badge */}
          {isAlertRow && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[9px] uppercase tracking-widest text-rose-400 font-mono font-bold
                         px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/20
                         delta-alert-glow"
            >
              ⚠ Significant Drift
            </motion.span>
          )}

          {/* Delta chip */}
          {showDelta && (
            <DeltaIndicator
              scoreA={metricA.score}
              scoreB={metricB.score}
              compact
            />
          )}
        </div>
      </div>

      {/* Bars + sparklines grid */}
      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Dataset A */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6b2fbf] flex-shrink-0" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                Dataset A
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-white tabular-nums font-mono">
                {Math.round(metricA.score * 100)}%
              </span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${sA.tag}`}>
                {biasLabels[levelA]}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${sA.barClass} ${sA.barGlow}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(metricA.score * 100)}%` }}
              transition={{ duration: 0.75, delay: 0.2 + index * 0.06, ease: 'easeOut' }}
            />
          </div>
          {showSparklines && (
            <MetricSparkline trend={metricA.trend ?? []} color={sA.sparkColor} />
          )}
        </div>

        {/* Dataset B */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6] flex-shrink-0" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                Dataset B
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-white tabular-nums font-mono">
                {Math.round(metricB.score * 100)}%
              </span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${sB.tag}`}>
                {biasLabels[levelB]}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${sB.barClass} ${sB.barGlow}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(metricB.score * 100)}%` }}
              transition={{ duration: 0.75, delay: 0.3 + index * 0.06, ease: 'easeOut' }}
            />
          </div>
          {showSparklines && (
            <MetricSparkline trend={metricB.trend ?? []} color="#3b82f6" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────
   COMPARISON CHART — metric-by-metric panel
───────────────────────────────────────────────────── */

/**
 * Full metric comparison panel with progress bars, sparklines,
 * delta indicators and drift alerts.
 *
 * @param {{
 *   datasetA:       import('../../data/comparisonData').DatasetSummary,
 *   datasetB:       import('../../data/comparisonData').DatasetSummary,
 *   showDelta:      boolean,
 *   showSparklines: boolean,
 * }} props
 */
const ComparisonChart = ({ datasetA, datasetB, showDelta, showSparklines = true }) => {
  if (!datasetA || !datasetB) return null;

  // Pair metrics by ID (memoised at parent via useMemo)
  const metricsB_map = Object.fromEntries(
    datasetB.metrics.map((m) => [m.id, m])
  );
  const paired = datasetA.metrics
    .filter((m) => metricsB_map[m.id])
    .map((m)  => ({ a: m, b: metricsB_map[m.id] }));

  // How many rows have significant drift
  const driftCount = paired.filter(({ a, b }) =>
    calcDelta(a.score, b.score).significant
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-white">
            Metric-by-Metric Comparison
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {paired.length} metrics compared
            {driftCount > 0 && showDelta && (
              <span className="ml-2 text-rose-400/80">
                · {driftCount} with significant drift (&gt;15%)
              </span>
            )}
          </p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6b2fbf]" /> Dataset A
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Dataset B
          </span>
        </div>
      </div>

      {/* Metric rows */}
      <div className="space-y-2">
        {paired.map((pair, i) => (
          <MetricRow
            key={pair.a.id}
            metricA={pair.a}
            metricB={pair.b}
            showDelta={showDelta}
            showSparklines={showSparklines}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ComparisonChart;

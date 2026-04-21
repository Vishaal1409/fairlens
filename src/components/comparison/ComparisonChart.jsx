import React from 'react';
import { motion } from 'framer-motion';
import DeltaIndicator from './DeltaIndicator';
import { getBiasLevel, biasLabels } from '../../data/comparisonData';

/**
 * Per-metric comparison row with progress bars for both datasets
 * and an optional delta column.
 */
const MetricRow = ({ metricA, metricB, showDelta, index }) => {
  const levelA = getBiasLevel(metricA.score);
  const levelB = getBiasLevel(metricB.score);

  const barColor = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  };

  const barGlow = {
    good: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    warning: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    danger: 'shadow-[0_0_8px_rgba(244,63,94,0.3)]',
  };

  const tagStyle = {
    good: 'text-emerald-400 bg-emerald-500/10',
    warning: 'text-amber-400 bg-amber-500/10',
    danger: 'text-rose-400 bg-rose-500/10',
  };

  const delta = Math.abs(metricB.score - metricA.score);
  const isSignificant = delta > 0.15;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={`
        p-4 rounded-xl border transition-all duration-300
        ${isSignificant && showDelta
          ? 'bg-rose-500/[0.04] border-rose-500/15 hover:border-rose-500/25'
          : 'bg-white/[0.02] border-white/[0.04] hover:border-white/10'}
      `}
    >
      {/* Metric Name */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[13px] font-medium text-white">{metricA.label}</h4>
        {isSignificant && showDelta && (
          <span className="text-[9px] uppercase tracking-widest text-rose-400/80 font-mono font-bold px-2 py-0.5 bg-rose-500/10 rounded-full">
            Significant Drift
          </span>
        )}
      </div>

      {/* Progress Bars & Scores Grid */}
      <div className={`grid gap-4 ${showDelta ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-2'}`}>
        {/* Dataset A */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
              Dataset A
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-white tabular-nums font-mono">
                {Math.round(metricA.score * 100)}%
              </span>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${tagStyle[levelA]}`}
              >
                {biasLabels[levelA]}
              </span>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor[levelA]} ${barGlow[levelA]}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(metricA.score * 100)}%` }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.06, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Dataset B */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
              Dataset B
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-white tabular-nums font-mono">
                {Math.round(metricB.score * 100)}%
              </span>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${tagStyle[levelB]}`}
              >
                {biasLabels[levelB]}
              </span>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor[levelB]} ${barGlow[levelB]}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(metricB.score * 100)}%` }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.06, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Delta Column */}
        {showDelta && (
          <div className="flex items-center justify-center min-w-[80px]">
            <DeltaIndicator
              scoreA={metricA.score}
              scoreB={metricB.score}
              significant={isSignificant}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * The full Metric Comparison Module. Renders a stacked list of
 * MetricRow components for every metric shared between two datasets.
 *
 * @param {{ datasetA: DatasetSummary, datasetB: DatasetSummary, showDelta: boolean }} props
 */
const ComparisonChart = ({ datasetA, datasetB, showDelta }) => {
  if (!datasetA || !datasetB) return null;

  // Pair metrics by ID
  const metricsB_map = Object.fromEntries(
    datasetB.metrics.map((m) => [m.id, m])
  );
  const paired = datasetA.metrics
    .filter((m) => metricsB_map[m.id])
    .map((m) => ({ a: m, b: metricsB_map[m.id] }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-white">Metric-by-Metric Comparison</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {paired.length} metrics compared • Rows highlighted in red indicate significant drift (&gt;15%)
          </p>
        </div>
      </div>

      {/* Metric Rows */}
      <div className="space-y-2">
        {paired.map((pair, i) => (
          <MetricRow
            key={pair.a.id}
            metricA={pair.a}
            metricB={pair.b}
            showDelta={showDelta}
            index={i}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ComparisonChart;

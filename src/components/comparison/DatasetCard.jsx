import React from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Target,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import { biasLabels } from '../../data/comparisonData';

/**
 * High-level summary card for a single dataset.
 * Shows total rows, composite fairness score, target variable, and upload date.
 *
 * @param {{ dataset: import('../../data/comparisonData').DatasetSummary, label: string, accentColor: string }} props
 */
const DatasetCard = ({ dataset, label = 'Dataset', accentColor = '#6b2fbf' }) => {
  if (!dataset) {
    return (
      <div className="flex-1 min-w-0 rounded-2xl border border-solid border-white/10 p-8 flex flex-col items-center justify-center gap-3 text-center">
        <Database className="w-8 h-8 text-gray-600" />
        <p className="text-sm text-gray-500">Select a dataset to begin comparison</p>
      </div>
    );
  }

  const pct = Math.round(dataset.fairnessScore * 100);
  const level =
    dataset.fairnessScore >= 0.75
      ? 'good'
      : dataset.fairnessScore >= 0.5
        ? 'warning'
        : 'danger';

  const statusColors = {
    good: {
      ring: 'ring-emerald-500/30',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      dot: 'bg-emerald-500',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    },
    warning: {
      ring: 'ring-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      dot: 'bg-amber-500',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    },
    danger: {
      ring: 'ring-rose-500/30',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      dot: 'bg-rose-500',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    },
  };

  const s = statusColors[level];

  const rows = [
    {
      icon: <Layers className="w-3.5 h-3.5" />,
      label: 'Total Rows',
      value: dataset.totalRows.toLocaleString(),
    },
    {
      icon: <Target className="w-3.5 h-3.5" />,
      label: 'Target Variable',
      value: dataset.targetVariable,
    },
    {
      icon: <Calendar className="w-3.5 h-3.5" />,
      label: 'Uploaded',
      value: new Date(dataset.uploadedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    },
    {
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      label: 'Metrics Tracked',
      value: dataset.metrics.length,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex-1 min-w-0 rounded-2xl bg-[#1b1c1d] border border-white/5 overflow-hidden shadow-xl shadow-black/20"
    >
      {/* Accent Bar */}
      <div className="h-1" style={{ background: accentColor }} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1">
              {label}
            </p>
            <h3 className="text-[15px] font-semibold text-white leading-tight">
              {dataset.name}
            </h3>
          </div>

          {/* Fairness Score Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ${s.ring} ${s.bg} ${s.glow}`}
          >
            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className={`text-xs font-semibold tabular-nums ${s.text}`}>
              {pct}%
            </span>
            <span className={`text-[10px] font-medium ${s.text} opacity-70`}>
              {biasLabels[level]}
            </span>
          </div>
        </div>

        {/* Fairness Score Ring */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="3"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={accentColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${pct} ${100 - pct}`}
                initial={{ strokeDasharray: '0 100' }}
                animate={{ strokeDasharray: `${pct} ${100 - pct}` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[13px] font-bold text-white tabular-nums">
                {pct}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
              Composite Fairness
            </p>
            <p className="text-[13px] text-gray-300">
              Across {dataset.metrics.length} metrics
            </p>
          </div>
        </div>

        {/* Detail Rows */}
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.03]"
            >
              <div className="flex items-center gap-2.5 text-gray-500">
                {row.icon}
                <span className="text-[11px] font-medium">{row.label}</span>
              </div>
              <span className="text-[12px] font-medium text-gray-300 font-mono">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DatasetCard;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompareArrows,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
} from 'lucide-react';
import DatasetCard from '../components/comparison/DatasetCard';
import ComparisonChart from '../components/comparison/ComparisonChart';
import DeltaIndicator from '../components/comparison/DeltaIndicator';
import { availableDatasets } from '../data/comparisonData';

// ── Dataset Selector Dropdown ────────────────────────────────────

const DatasetSelector = ({ value, onChange, excludeId, label }) => {
  const [open, setOpen] = useState(false);
  const selected = availableDatasets.find((d) => d.id === value);

  return (
    <div className="relative">
      <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1.5">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[#1b1c1d] border border-white/5 hover:border-white/10 transition-colors text-left cursor-pointer"
      >
        <span className={`text-[13px] ${selected ? 'text-white' : 'text-gray-500'}`}>
          {selected ? selected.name : 'Choose dataset…'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full rounded-xl bg-[#1f2021] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
          >
            {availableDatasets
              .filter((d) => d.id !== excludeId)
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onChange(d.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/[0.03] last:border-b-0 cursor-pointer ${
                    d.id === value ? 'bg-[#6b2fbf]/10 text-[#d6baff]' : 'text-gray-300'
                  }`}
                >
                  <div className="text-[13px] font-medium">{d.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                    {d.totalRows.toLocaleString()} rows · {d.targetVariable}
                  </div>
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Summary Delta Banner ─────────────────────────────────────────

const SummaryDelta = ({ datasetA, datasetB }) => {
  const delta = datasetB.fairnessScore - datasetA.fairnessScore;
  const absDelta = Math.abs(delta);
  const improved = delta > 0;

  const significant = absDelta > 0.1;
  const Icon = significant ? AlertTriangle : CheckCircle2;

  const style = significant
    ? {
        wrapper: 'bg-rose-500/[0.06] border-rose-500/15',
        icon: 'text-rose-400',
        text: 'text-rose-300',
      }
    : {
        wrapper: 'bg-emerald-500/[0.06] border-emerald-500/15',
        icon: 'text-emerald-400',
        text: 'text-emerald-300',
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border ${style.wrapper}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${style.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium ${style.text}`}>
          {significant
            ? `Significant fairness gap detected — ${Math.round(absDelta * 100)}% ${improved ? 'improvement' : 'regression'} from A → B`
            : `Minimal drift — fairness scores are within ${Math.round(absDelta * 100)}% of each other`}
        </p>
      </div>
      <DeltaIndicator scoreA={datasetA.fairnessScore} scoreB={datasetB.fairnessScore} />
    </motion.div>
  );
};

// ── Main Comparison Page ─────────────────────────────────────────

const ComparisonPage = () => {
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [showDelta, setShowDelta] = useState(false);
  const [compared, setCompared] = useState(false);

  const datasetA = useMemo(
    () => availableDatasets.find((d) => d.id === idA) ?? null,
    [idA]
  );
  const datasetB = useMemo(
    () => availableDatasets.find((d) => d.id === idB) ?? null,
    [idB]
  );

  const canCompare = !!datasetA && !!datasetB;

  const handleCompare = () => {
    if (canCompare) setCompared(true);
  };

  const handleReset = () => {
    setIdA('');
    setIdB('');
    setShowDelta(false);
    setCompared(false);
  };

  const handleSwap = () => {
    setIdA(idB);
    setIdB(idA);
  };

  return (
    <div className="min-h-screen text-[#e3e2e3]">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-white">Dataset Comparison</h1>
        <p className="text-[13px] text-[#888780] mt-0.5">
          Compare bias metrics across datasets to identify data drift or fairness gaps
        </p>
      </div>

      {/* ── Sticky Control Bar ── */}
      <div className="sticky top-14 z-30 -mx-8 px-8 py-4 glass-panel border-b border-white/5 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
          {/* Selectors */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end w-full">
            <DatasetSelector
              value={idA}
              onChange={(v) => { setIdA(v); setCompared(false); }}
              excludeId={idB}
              label="Dataset A"
            />

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!canCompare}
              className="self-end p-2.5 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Swap datasets"
            >
              <ArrowRightLeft className="w-4 h-4 text-gray-400" />
            </button>

            <DatasetSelector
              value={idB}
              onChange={(v) => { setIdB(v); setCompared(false); }}
              excludeId={idA}
              label="Dataset B"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Difference View Toggle */}
            <button
              onClick={() => setShowDelta(!showDelta)}
              disabled={!compared}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                showDelta && compared
                  ? 'bg-[#6b2fbf]/15 text-[#d6baff] border border-[#6b2fbf]/25'
                  : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/10'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {showDelta ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              Δ Difference View
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-gray-400 text-[12px] font-medium transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            {/* Compare */}
            <button
              onClick={handleCompare}
              disabled={!canCompare}
              className={`premium-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-[12px] font-bold uppercase tracking-wider
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer`}
            >
              <GitCompareArrows className="w-4 h-4" />
              Compare
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <AnimatePresence mode="wait">
        {!compared ? (
          /* Empty / Selection State */
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <DatasetCard
                dataset={datasetA}
                label="Dataset A"
                accentColor="#6b2fbf"
              />
              <DatasetCard
                dataset={datasetB}
                label="Dataset B"
                accentColor="#3b82f6"
              />
            </div>

            {!canCompare && (
              <div className="text-center py-16">
                <GitCompareArrows className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">
                  Select two datasets above, then press{' '}
                  <span className="text-[#d6baff] font-semibold">Compare</span> to analyze
                  fairness drift.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          /* Comparison Results */
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <DatasetCard
                dataset={datasetA}
                label="Dataset A"
                accentColor="#6b2fbf"
              />
              <DatasetCard
                dataset={datasetB}
                label="Dataset B"
                accentColor="#3b82f6"
              />
            </div>

            {/* Summary Delta Banner */}
            <div className="mb-6">
              <SummaryDelta datasetA={datasetA} datasetB={datasetB} />
            </div>

            {/* Metric-by-Metric Comparison */}
            <ComparisonChart
              datasetA={datasetA}
              datasetB={datasetB}
              showDelta={showDelta}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparisonPage;

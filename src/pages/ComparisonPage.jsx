import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  Download,
  Loader2,
  Sparkles,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import DatasetCard    from '../components/comparison/DatasetCard';
import ComparisonChart from '../components/comparison/ComparisonChart';
import DeltaIndicator  from '../components/comparison/DeltaIndicator';
import { availableDatasets } from '../data/comparisonData';
import { exportComparisonPDF } from '../utils/exportComparisonPDF';

/* ══════════════════════════════════════════════════════════
   DATASET SELECTOR DROPDOWN
══════════════════════════════════════════════════════════ */

const DatasetSelector = ({ value, onChange, excludeId, label, accentColor = '#6b2fbf' }) => {
  const [open, setOpen]     = useState(false);
  const ref                 = useRef(null);
  const selected            = availableDatasets.find((d) => d.id === value);

  // Close on outside click
  React.useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-mono mb-1.5">
        {label}
      </label>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl
                   bg-[#1b1c1d] border border-white/5 hover:border-white/12
                   transition-all duration-200 text-left cursor-pointer
                   focus:outline-none focus-visible:ring-1 focus-visible:ring-[#6b2fbf]/50"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selected && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />
          )}
          <span className={`text-[13px] truncate ${selected ? 'text-white' : 'text-gray-500'}`}>
            {selected ? selected.name : 'Choose dataset…'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full rounded-2xl bg-[#1f2021]
                       border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
          >
            {availableDatasets
              .filter((d) => d.id !== excludeId)
              .map((d) => (
                <li
                  key={d.id}
                  role="option"
                  aria-selected={d.id === value}
                  onClick={() => { onChange(d.id); setOpen(false); }}
                  className={`w-full text-left px-4 py-3 cursor-pointer
                              hover:bg-white/5 transition-colors
                              border-b border-white/[0.03] last:border-b-0
                              ${d.id === value ? 'bg-[#6b2fbf]/10' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.id === value ? accentColor : '#4b5563' }}
                    />
                    <span className={`text-[13px] font-medium ${d.id === value ? 'text-[#d6baff]' : 'text-gray-300'}`}>
                      {d.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-mono ml-4.5 pl-[18px]">
                    {d.totalRows.toLocaleString()} rows · {d.targetVariable}
                  </p>
                </li>
              ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   SUMMARY DELTA BANNER  (composite score delta)
══════════════════════════════════════════════════════════ */

const SummaryDeltaBanner = ({ datasetA, datasetB }) => {
  const delta    = datasetB.fairnessScore - datasetA.fairnessScore;
  const absDelta = Math.abs(delta);
  const improved = delta > 0;
  const signif   = absDelta > 0.1;

  const Icon  = signif ? (improved ? TrendingUp : AlertTriangle) : CheckCircle2;
  const style = signif && !improved
    ? { wrapper: 'bg-rose-500/[0.06] border-rose-500/20',   icon: 'text-rose-400',    text: 'text-rose-300'    }
    : signif && improved
    ? { wrapper: 'bg-emerald-500/[0.06] border-emerald-500/20', icon: 'text-emerald-400', text: 'text-emerald-300' }
    : { wrapper: 'bg-[#6b2fbf]/[0.06] border-[#6b2fbf]/20',    icon: 'text-[#d6baff]',  text: 'text-[#d6baff]'  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${style.wrapper}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${style.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold ${style.text}`}>
          {signif && !improved
            ? `Fairness regression detected — Dataset B scores ${Math.round(absDelta * 100)}% lower than A`
            : signif && improved
            ? `Fairness improved — Dataset B scores ${Math.round(absDelta * 100)}% higher than A`
            : `Minimal drift — both datasets within ${Math.round(absDelta * 100)}% of each other`}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Composite: A {Math.round(datasetA.fairnessScore * 100)}% → B {Math.round(datasetB.fairnessScore * 100)}%
        </p>
      </div>
      <DeltaIndicator scoreA={datasetA.fairnessScore} scoreB={datasetB.fairnessScore} />
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   REPORT ACTION BAR — PDF export + sparkline toggle
══════════════════════════════════════════════════════════ */

const ReportActionBar = ({ datasetA, datasetB, showSparklines, onToggleSpark }) => {
  const [exporting, setExporting] = useState(false);
  const [exported,  setExported ] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting || !datasetA || !datasetB) return;
    setExporting(true);
    // Microtask breath so React updates the loading state
    await new Promise((r) => setTimeout(r, 50));
    try {
      exportComparisonPDF(datasetA, datasetB);
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [exporting, datasetA, datasetB]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl
                 glass-panel border border-white/8 mb-6"
    >
      {/* Left: report meta */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#6b2fbf]/10 border border-[#6b2fbf]/20">
          <Activity size={14} className="text-[#d6baff]" />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-white">Comparison Report</p>
          <p className="text-[10px] text-gray-500">
            {datasetA.name} <span className="text-gray-600">vs</span> {datasetB.name}
          </p>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2.5">
        {/* Sparkline toggle */}
        <button
          onClick={onToggleSpark}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-medium
                      transition-all duration-200 cursor-pointer
                      ${showSparklines
                        ? 'bg-[#6b2fbf]/15 text-[#d6baff] border border-[#6b2fbf]/25'
                        : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/15'}`}
        >
          <BarChart3 size={12} />
          Sparklines {showSparklines ? 'On' : 'Off'}
        </button>

        {/* PDF export CTA */}
        <motion.button
          id="comparison-export-pdf-btn"
          onClick={handleExport}
          disabled={exporting}
          whileHover={!exporting ? { scale: 1.02, y: -1 } : {}}
          whileTap={!exporting ? { scale: 0.97 } : {}}
          className="premium-btn relative flex items-center gap-2 px-5 py-2 rounded-xl
                     text-white text-[12px] font-bold uppercase tracking-wider
                     cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b2fbf]/60"
        >
          <AnimatePresence mode="wait" initial={false}>
            {exporting ? (
              <motion.span key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Generating…
              </motion.span>
            ) : exported ? (
              <motion.span key="done" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-300" />
                Downloaded!
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2">
                <Download size={13} />
                Export PDF
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   EMPTY / PLACEHOLDER STATE
══════════════════════════════════════════════════════════ */

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      className="p-6 rounded-2xl bg-[#6b2fbf]/8 border border-[#6b2fbf]/15 mb-6"
    >
      <GitCompareArrows className="w-12 h-12 text-[#6b2fbf]/60" />
    </motion.div>
    <h3 className="text-white font-semibold text-[16px] mb-2">
      Select two datasets to compare
    </h3>
    <p className="text-gray-500 text-[13px] max-w-xs leading-relaxed">
      Choose Dataset A and Dataset B from the dropdowns above, then press{' '}
      <span className="text-[#d6baff] font-medium">Compare</span> to run the
      side-by-side fairness audit.
    </p>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════
   MAIN COMPARISON PAGE
══════════════════════════════════════════════════════════ */

const ComparisonPage = () => {
  const [idA,            setIdA           ] = useState('');
  const [idB,            setIdB           ] = useState('');
  const [showDelta,      setShowDelta     ] = useState(false);
  const [showSparklines, setShowSparklines] = useState(true);
  const [compared,       setCompared      ] = useState(false);

  /* ── Derived datasets (memoised) ── */
  const datasetA = useMemo(
    () => availableDatasets.find((d) => d.id === idA) ?? null,
    [idA]
  );
  const datasetB = useMemo(
    () => availableDatasets.find((d) => d.id === idB) ?? null,
    [idB]
  );

  const canCompare = !!datasetA && !!datasetB;

  /* ── Memoised paired metrics ── */
  const pairedCount = useMemo(() => {
    if (!datasetA || !datasetB) return 0;
    const bIds = new Set(datasetB.metrics.map((m) => m.id));
    return datasetA.metrics.filter((m) => bIds.has(m.id)).length;
  }, [datasetA, datasetB]);

  const handleCompare = () => { if (canCompare) setCompared(true); };

  const handleReset = () => {
    setIdA(''); setIdB('');
    setShowDelta(false);
    setCompared(false);
  };

  const handleSwap = () => { setIdA(idB); setIdB(idA); };

  return (
    <div className="min-h-screen text-[#e3e2e3]">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-1 h-5 rounded-full bg-[#6b2fbf]" />
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Dataset Comparison
          </h1>
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#6b2fbf]/10
                           border border-[#6b2fbf]/20 text-[10px] font-semibold
                           text-[#d6baff] uppercase tracking-wider">
            Side-by-Side
          </span>
        </div>
        <p className="text-[13px] text-[#888780] ml-3.5">
          Compare bias metrics across datasets to identify data drift or fairness gaps
        </p>
      </motion.div>

      {/* ── Sticky Control Bar ── */}
      <div className="sticky top-14 z-30 -mx-8 px-8 py-4 glass-panel border-b border-white/[0.05] mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
          {/* Dataset selectors + swap */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end w-full">
            <DatasetSelector
              value={idA}
              onChange={(v) => { setIdA(v); setCompared(false); }}
              excludeId={idB}
              label="Dataset A"
              accentColor="#6b2fbf"
            />

            {/* Swap */}
            <motion.button
              onClick={handleSwap}
              disabled={!canCompare}
              whileHover={canCompare ? { rotate: 180 } : {}}
              transition={{ duration: 0.25 }}
              title="Swap A ↔ B"
              className="self-end p-2.5 rounded-xl border border-white/5
                         hover:border-white/15 hover:bg-white/5
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-gray-400" />
            </motion.button>

            <DatasetSelector
              value={idB}
              onChange={(v) => { setIdB(v); setCompared(false); }}
              excludeId={idA}
              label="Dataset B"
              accentColor="#3b82f6"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Delta toggle */}
            <button
              onClick={() => setShowDelta((v) => !v)}
              disabled={!compared}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px]
                          font-medium transition-all cursor-pointer
                          ${showDelta && compared
                            ? 'bg-[#6b2fbf]/15 text-[#d6baff] border border-[#6b2fbf]/25'
                            : 'bg-white/5 text-gray-400 border border-white/5 hover:border-white/10'}
                          disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {showDelta ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              Δ Difference View
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5
                         border border-white/5 hover:border-white/10 text-gray-400
                         text-[12px] font-medium transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            {/* Compare CTA */}
            <motion.button
              id="dataset-compare-btn"
              onClick={handleCompare}
              disabled={!canCompare}
              whileHover={canCompare ? { scale: 1.03, y: -1 } : {}}
              whileTap={canCompare ? { scale: 0.98 } : {}}
              className={`premium-btn flex items-center gap-2 px-6 py-2.5 rounded-xl
                          text-white text-[12px] font-bold uppercase tracking-wider
                          disabled:opacity-40 disabled:cursor-not-allowed
                          disabled:shadow-none cursor-pointer`}
            >
              <GitCompareArrows className="w-4 h-4" />
              Compare
            </motion.button>
          </div>
        </div>

        {/* Quick stats when datasets are selected */}
        <AnimatePresence>
          {canCompare && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-6
                         text-[11px] text-gray-500 overflow-hidden"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={10} className="text-[#6b2fbf]" />
                {pairedCount} shared metrics
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6b2fbf]" />
                A: {Math.round((datasetA?.fairnessScore ?? 0) * 100)}% composite
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                B: {Math.round((datasetB?.fairnessScore ?? 0) * 100)}% composite
              </span>
              <DeltaIndicator
                scoreA={datasetA?.fairnessScore ?? 0}
                scoreB={datasetB?.fairnessScore ?? 0}
                compact
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Content Area ── */}
      <AnimatePresence mode="wait">
        {!compared ? (
          /* Pre-comparison: show individual cards + empty prompt */
          <motion.div
            key="pre"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {(datasetA || datasetB) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <DatasetCard dataset={datasetA} label="Dataset A" accentColor="#6b2fbf" />
                <DatasetCard dataset={datasetB} label="Dataset B" accentColor="#3b82f6" />
              </div>
            ) : null}

            <EmptyState />
          </motion.div>
        ) : (
          /* Post-comparison: full report */
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42 }}
          >
            {/* ① Report action bar with PDF export */}
            <ReportActionBar
              datasetA={datasetA}
              datasetB={datasetB}
              showSparklines={showSparklines}
              onToggleSpark={() => setShowSparklines((v) => !v)}
            />

            {/* ② Dataset summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <DatasetCard dataset={datasetA} label="Dataset A" accentColor="#6b2fbf" />
              <DatasetCard dataset={datasetB} label="Dataset B" accentColor="#3b82f6" />
            </div>

            {/* ③ Overall delta banner */}
            <div className="mb-6">
              <SummaryDeltaBanner datasetA={datasetA} datasetB={datasetB} />
            </div>

            {/* ④ Metric-by-metric comparison (with sparklines + drift alerts) */}
            <ComparisonChart
              datasetA={datasetA}
              datasetB={datasetB}
              showDelta={showDelta}
              showSparklines={showSparklines}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparisonPage;

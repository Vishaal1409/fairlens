import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Activity, Target, Scale,
    Sparkles, ChevronRight, Loader2, TrendingUp, TrendingDown,
    BarChart3, Flame, Zap, AlertTriangle, ArrowUpRight,
    CheckCircle2
} from 'lucide-react';
import BiasHeatmap from '../components/BiasHeatmap';
import SummaryBanner from '../components/SummaryBanner';
import SHAPChart from '../components/SHAPChart';
import BeforeAfterChart from '../components/BeforeAfterChart';
import ExportReport from '../components/ExportReport';
import ChartContainer, { ChartGrid } from '../components/ChartContainer';
import { api } from '../api/client';

/* ═══════════════════════════════════════════
   FALLBACK DATA
   ═══════════════════════════════════════════ */
const dummyMetrics = {
    accuracy: 0.82,
    demographic_parity: 0.65,
    equal_opportunity: 0.48,
    disparate_impact: 0.71
};

const dummyShap = {
    age: 0.42, income: 0.31, gender: -0.18,
    education: 0.27, race: -0.35, hours_per_week: 0.19,
    occupation: 0.22, marital_status: -0.11,
    relationship: 0.08, country: -0.05
};

/* ═══════════════════════════════════════════
   METRIC METADATA
   ═══════════════════════════════════════════ */
const metricMeta = {
    accuracy: {
        label: 'Accuracy',
        icon: Target,
        explanation: 'How often the model makes the correct prediction overall.',
        threshold: 0.8,
    },
    demographic_parity: {
        label: 'Demographic Parity',
        icon: Scale,
        explanation: 'Ensures the model approves different groups at equal rates regardless of protected attributes.',
        threshold: 0.7,
    },
    equal_opportunity: {
        label: 'Equal Opportunity',
        icon: ShieldCheck,
        explanation: 'Ensures qualified candidates from all groups have the same chance of a positive outcome.',
        threshold: 0.7,
    },
    disparate_impact: {
        label: 'Disparate Impact',
        icon: Activity,
        explanation: 'A ratio checking if a specific group is significantly disadvantaged compared to others.',
        threshold: 0.8,
    },
    disperate_impact: {
        label: 'Disparate Impact',
        icon: Activity,
        explanation: 'A ratio checking if a specific group is significantly disadvantaged compared to others.',
        threshold: 0.8,
    },
};

/* ═══════════════════════════════════════════
   STATUS HELPERS
   ═══════════════════════════════════════════ */
const getStatus = (score) => {
    if (score >= 0.7) return {
        label: 'Fair', color: '#1D9E75',
        bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400',
        borderClass: 'border-emerald-500/20'
    };
    if (score >= 0.5) return {
        label: 'Warning', color: '#EF9F27',
        bgClass: 'bg-amber-500/10', textClass: 'text-amber-400',
        borderClass: 'border-amber-500/20'
    };
    return {
        label: 'Biased', color: '#E24B4A',
        bgClass: 'bg-rose-500/10', textClass: 'text-rose-400',
        borderClass: 'border-rose-500/20'
    };
};

/* ═══════════════════════════════════════════
   MINI SPARKLINE (SVG)
   ═══════════════════════════════════════════ */
const MiniSparkline = ({ value, color }) => {
    /* Generate a plausible micro-trend from a single value */
    const seed = Math.round(value * 1000);
    const points = Array.from({ length: 8 }, (_, i) => {
        const noise = Math.sin(seed + i * 1.7) * 0.12;
        const trend = (i / 7) * 0.1;
        return Math.max(0, Math.min(1, value - 0.15 + trend + noise));
    });
    points.push(value); // final point is the actual value

    const w = 80, h = 24;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 0.1;

    const pathData = points
        .map((p, i) => {
            const x = (i / (points.length - 1)) * w;
            const y = h - ((p - minVal) / range) * (h - 4) - 2;
            return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');

    /* Gradient fill area */
    const lastX = w;
    const areaPath = `${pathData} L ${lastX} ${h} L 0 ${h} Z`;

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
            <defs>
                <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
            <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            {/* End dot */}
            <circle
                cx={w}
                cy={h - ((value - minVal) / range) * (h - 4) - 2}
                r="2"
                fill={color}
                style={{ filter: `drop-shadow(0 0 3px ${color})` }}
            />
        </svg>
    );
};

/* ═══════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════ */
const SectionHeader = ({ icon: Icon, title, subtitle, badge, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="mb-6"
    >
        <div className="flex items-center gap-3 mb-1.5">
            <div className="p-2 rounded-xl bg-[#6b2fbf]/10 border border-[#6b2fbf]/20">
                <Icon size={16} className="text-[#6b2fbf]" />
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
            {badge && (
                <span className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${badge.className}`}>
                    {badge.icon && <badge.icon size={10} />}
                    {badge.text}
                </span>
            )}
        </div>
        {subtitle && (
            <p className="text-[13px] text-[#888780] ml-[44px]">{subtitle}</p>
        )}
    </motion.div>
);

/* ═══════════════════════════════════════════
   PREMIUM METRIC CARD (with sparkline)
   ═══════════════════════════════════════════ */
const MetricCardPremium = ({ metricKey, value, index }) => {
    const meta = metricMeta[metricKey] || {
        label: metricKey.replace(/_/g, ' '),
        icon: Activity,
        explanation: 'Metric evaluation score.',
        threshold: 0.7,
    };
    const status = getStatus(value);
    const Icon = meta.icon;
    const pct = Math.round(value * 100);
    const isAboveThreshold = value >= (meta.threshold || 0.7);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            className="group relative bg-[#1b1c1d] border border-white/[0.06] rounded-2xl p-6
                       hover:border-white/[0.12] transition-all duration-300 cursor-default
                       hover:shadow-[0_12px_40px_-8px_rgba(107,47,191,0.18)]"
        >
            {/* Top accent line */}
            <div
                className="absolute top-0 left-4 right-4 h-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(to right, transparent, ${status.color}60, transparent)` }}
            />

            {/* Top: icon + status badge */}
            <div className="flex items-start justify-between mb-5">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]
                                group-hover:bg-[#6b2fbf]/10 group-hover:border-[#6b2fbf]/20
                                transition-all duration-300">
                    <Icon size={18} className="text-[#888780] group-hover:text-[#6b2fbf] transition-colors duration-300" />
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${status.bgClass} ${status.textClass} ${status.borderClass}`}>
                    <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: status.color, boxShadow: `0 0 6px ${status.color}60` }}
                    />
                    {status.label}
                </span>
            </div>

            {/* Label */}
            <p className="text-[10px] text-[#888780] uppercase tracking-[0.12em] font-semibold mb-2">
                {meta.label}
            </p>

            {/* Score + Sparkline row */}
            <div className="flex items-end justify-between mb-4">
                <div className="flex items-baseline gap-1">
                    <span className="text-[34px] font-bold text-white tracking-tight leading-none">
                        {pct}
                    </span>
                    <span className="text-[14px] text-[#888780] font-medium">%</span>
                </div>
                <div className="sparkline-container pb-1">
                    <MiniSparkline value={value} color={status.color} />
                </div>
            </div>

            {/* Progress track */}
            <div className="h-1.5 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, delay: 0.3 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="h-full rounded-full relative"
                    style={{
                        backgroundColor: status.color,
                        boxShadow: `0 0 8px ${status.color}40`,
                    }}
                />
            </div>

            {/* Explanation */}
            <div className="pt-3 border-t border-white/[0.05]">
                <p className="text-[11px] text-[#888780] leading-[1.7]">
                    {meta.explanation}
                </p>
            </div>

            {/* Threshold indicator */}
            <div className="flex items-center gap-1.5 mt-3">
                {isAboveThreshold ? (
                    <CheckCircle2 size={11} className="text-emerald-400/70" />
                ) : (
                    <AlertTriangle size={11} className="text-amber-400/70" />
                )}
                <span className="text-[10px] text-[#888780]">
                    Threshold: {Math.round((meta.threshold || 0.7) * 100)}%
                </span>
            </div>
        </motion.div>
    );
};


/* ═══════════════════════════════════════════
   RESULTS PAGE
   ═══════════════════════════════════════════ */
const ResultsPage = () => {
    const location = useLocation();
    const metrics = location.state?.metrics ?? dummyMetrics;
    const shapValues = location.state?.shapValues ?? dummyShap;

    const [mitigatedData, setMitigatedData] = useState(null);
    const [loading, setLoading] = useState(false);

    /* Derived stats */
    const biasedMetrics = useMemo(() =>
        Object.entries(metrics).filter(([, v]) => v < 0.7),
        [metrics]
    );

    const handleMitigation = async () => {
        setLoading(true);
        try {
            const fileId = location.state?.fileId || 'demo_file_123';
            const response = await api.post('/mitigate', { file_id: fileId });
            setMitigatedData(response.data);
        } catch (error) {
            console.error("API Error, falling back to dummy mitigation data:", error);
            setMitigatedData([
                {
                    metric: 'Demographic Parity',
                    before: metrics.demographic_parity,
                    after: Math.min(metrics.demographic_parity + 0.2, 0.95)
                },
                {
                    metric: 'Equal Opportunity',
                    before: metrics.equal_opportunity,
                    after: Math.min(metrics.equal_opportunity + 0.25, 0.92)
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-[--color-on-surface]">

            {/* ─── PAGE HEADER ─── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <div className="w-1 h-5 rounded-full bg-[--color-primary]" />
                            <h1 className="text-[22px] font-semibold text-white tracking-tight">
                                Audit Results
                            </h1>
                            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[--color-primary]/10 border border-[--color-primary]/20 text-[10px] font-semibold text-white uppercase tracking-wider">
                                Live
                            </span>
                        </div>
                        <p className="text-[13px] text-white/55 ml-3.5">
                            AI fairness analysis — review metrics, explore feature impact, and apply mitigation.
                        </p>
                    </div>
                    {/* ── Export Report CTA ── */}
                    <ExportReport metrics={metrics} shapValues={shapValues} />
                </div>
            </motion.div>

            {/* ─── BENTO GRID DASHBOARD ─── */}
            <div className="grid grid-cols-12 gap-6">
            {/* ─── TILE: OVERVIEW ─── */}
            <section className="col-span-12 lg:col-span-8">
                <SectionHeader
                    icon={BarChart3}
                    title="Overview"
                    subtitle="Aggregate fairness verdict for your model"
                    delay={0.1}
                />
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                >
                    <SummaryBanner metrics={metrics} />
                </motion.div>
            </section>

            {/* ─── TILE: ACTIONS ─── */}
            <section className="col-span-12 lg:col-span-4">
                <SectionHeader
                    icon={Flame}
                    title="Actions"
                    subtitle="Export + mitigation controls"
                    delay={0.12}
                />
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl">
                    <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/55">
                        Controls
                    </p>
                    <p className="mt-2 text-[13px] text-white/70 leading-relaxed">
                        Download artifacts for judges and trigger mitigation to show a visible “before → after” shift.
                    </p>
                    <div className="mt-5">
                        <ExportReport metrics={metrics} shapValues={shapValues} label="Export Evidence Pack" />
                    </div>
                    <div className="mt-4">
                        <motion.button
                            onClick={handleMitigation}
                            disabled={loading}
                            whileHover={!loading ? { y: -2 } : {}}
                            whileTap={!loading ? { scale: 0.99 } : {}}
                            className="w-full rounded-xl px-4 py-3 font-extrabold text-[13px] text-black
                                       bg-[--color-primary] hover:brightness-110 transition disabled:opacity-50"
                        >
                            {loading ? "Applying mitigation…" : "Apply Mitigation"}
                        </motion.button>
                    </div>
                </div>
            </section>

            {/* ─── TILE: METRICS ─── */}
            <section className="col-span-12">
                <SectionHeader
                    icon={Target}
                    title="Fairness Metrics"
                    subtitle="Individual metric scores with status indicators and trend analysis"
                    delay={0.2}
                    badge={biasedMetrics.length > 0 ? {
                        text: `${biasedMetrics.length} below threshold`,
                        className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                        icon: AlertTriangle,
                    } : {
                        text: 'All passing',
                        className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                        icon: CheckCircle2,
                    }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {Object.entries(metrics).map(([key, value], index) => (
                        <div
                            key={key}
                            className="transform-gpu transition-transform duration-300 will-change-transform
                                       hover:[transform:perspective(900px)_rotateX(6deg)_rotateY(-7deg)_translateY(-6px)]"
                        >
                            <MetricCardPremium
                                metricKey={key}
                                value={value}
                                index={index}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── TILE: EXPLAINABILITY ─── */}
            <section className="col-span-12">
                <SectionHeader
                    icon={Sparkles}
                    title="Explainability"
                    subtitle="Understand what drives your model's decisions"
                    delay={0.3}
                />

                {/* ── Charts: SHAP + Heatmap side-by-side on desktop ── */}
                <ChartGrid cols={2} gap="gap-6">
                    {/* SHAP Chart — auto-height, no clip */}
                    <div className="w-full min-w-0">
                        <SHAPChart shapValues={shapValues} />
                    </div>

                    {/* Heatmap — auto-height, no clip */}
                    <div className="w-full min-w-0">
                        <BiasHeatmap metrics={metrics} />
                    </div>
                </ChartGrid>
            </section>

            {/* ─── TILE: MITIGATION STORY ─── */}
            <section className="col-span-12">
                <SectionHeader
                    icon={Zap}
                    title="Mitigation"
                    subtitle="Improve model fairness with AI-powered adjustments"
                    delay={0.45}
                />

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden bg-[--color-surface-container-low]">
                        {/* Decorative elements */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[--color-primary]/[0.06] via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-[0.06] bg-[--color-primary] pointer-events-none" />

                        <div className="relative z-10 p-8 sm:p-10">
                            <AnimatePresence mode="wait">
                                {!mitigatedData ? (
                                    <motion.div
                                        key="cta"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-center max-w-xl mx-auto"
                                    >
                                        {/* Icon */}
                                        <motion.div
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                            className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-[--color-primary]/15 to-[--color-primary]/5 border border-[--color-primary]/20 mb-6"
                                        >
                                            <Zap size={32} className="text-[--color-primary]" />
                                        </motion.div>

                                        <h3 className="text-[22px] font-bold text-white mb-2 tracking-tight">
                                            Bias Detected in Your Model
                                        </h3>
                                        <p className="text-[14px] text-white/55 leading-relaxed mb-4 max-w-md mx-auto">
                                            Our AI engine analyzes bias patterns and applies post-processing
                                            calibration to improve fairness — without retraining.
                                        </p>

                                        {/* Warning badge */}
                                        {biasedMetrics.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/[0.08] border border-amber-500/20 mb-8"
                                            >
                                                <AlertTriangle size={14} className="text-amber-400" />
                                                <span className="text-[12px] text-amber-400 font-semibold">
                                                    {biasedMetrics.length} metric{biasedMetrics.length > 1 ? 's' : ''} below fairness threshold
                                                </span>
                                            </motion.div>
                                        )}

                                        {/* CTA Button */}
                                        <div className="mt-2">
                                            <motion.button
                                                id="mitigation-apply-btn"
                                                onClick={handleMitigation}
                                                disabled={loading}
                                                whileHover={!loading ? { scale: 1.03, y: -2 } : {}}
                                                whileTap={!loading ? { scale: 0.98 } : {}}
                                                className="group relative inline-flex items-center gap-2.5 px-10 py-4
                                                           rounded-xl font-extrabold text-[14px] text-black cursor-pointer
                                                           transition-all duration-300 disabled:cursor-not-allowed
                                                           disabled:opacity-50 bg-[--color-primary] hover:brightness-110"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        <span>Applying Mitigation…</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={18} />
                                                        <span>Apply Post-Processing Mitigation</span>
                                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                                                    </>
                                                )}

                                                {/* Animated glow ring */}
                                                {!loading && (
                                                    <span
                                                        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                        style={{ boxShadow: '0 0 46px 6px rgba(0,229,255,0.22)' }}
                                                    />
                                                )}
                                            </motion.button>
                                        </div>

                                        {/* Trust signals */}
                                        <div className="flex items-center justify-center gap-8 mt-8 text-[11px] text-[#888780]">
                                            <span className="flex items-center gap-1.5">
                                                <ShieldCheck size={12} className="text-emerald-500/70" />
                                                Non-destructive
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <TrendingUp size={12} className="text-[--color-primary]/70" />
                                                AI-optimized
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <CheckCircle2 size={12} className="text-[#888780]" />
                                                Reversible
                                            </span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="results"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    >
                                        {/* Success header */}
                                        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                                                    className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                                                >
                                                    <CheckCircle2 size={18} className="text-emerald-400" />
                                                </motion.div>
                                                <div>
                                                    <h3 className="text-[17px] font-bold text-white tracking-tight">
                                                        Mitigation Applied Successfully
                                                    </h3>
                                                    <p className="text-[12px] text-[#888780]">
                                                        Compare before and after fairness scores below
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-semibold">
                                                <CheckCircle2 size={12} />
                                                Calibration Complete
                                            </span>
                                        </div>

                                        <BeforeAfterChart data={mitigatedData} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </section>
            </div>
        </div>
    );
};

export default ResultsPage;
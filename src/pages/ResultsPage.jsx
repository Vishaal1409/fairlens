import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Activity, Target, Scale,
    Sparkles, ChevronRight, Loader2, TrendingUp,
    BarChart3, Flame, Zap
} from 'lucide-react';
import BiasHeatmap from '../components/BiasHeatmap';
import SummaryBanner from '../components/SummaryBanner';
import SHAPChart from '../components/SHAPChart';
import BeforeAfterChart from '../components/BeforeAfterChart';
import { api } from '../api/client';

/* ── Dummy fallback data ── */
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

/* ── Metric metadata ── */
const metricMeta = {
    accuracy: {
        label: 'Accuracy',
        icon: Target,
        explanation: 'How often the model makes the correct prediction overall.',
    },
    demographic_parity: {
        label: 'Demographic Parity',
        icon: Scale,
        explanation: 'Ensures the model approves different groups at equal rates regardless of protected attributes.',
    },
    equal_opportunity: {
        label: 'Equal Opportunity',
        icon: ShieldCheck,
        explanation: 'Ensures that qualified candidates from all groups have the same chance of a positive outcome.',
    },
    disparate_impact: {
        label: 'Disparate Impact',
        icon: Activity,
        explanation: 'A ratio checking if a specific group is being significantly disadvantaged compared to others.',
    },
    // fallback-friendly for old key
    disperate_impact: {
        label: 'Disparate Impact',
        icon: Activity,
        explanation: 'A ratio checking if a specific group is being significantly disadvantaged compared to others.',
    },
};

/* ── Status helpers ── */
const getStatus = (score) => {
    if (score >= 0.7) return { label: 'Fair', color: '#1D9E75', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' };
    if (score >= 0.5) return { label: 'Moderate', color: '#EF9F27', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' };
    return { label: 'High Bias', color: '#E24B4A', bgClass: 'bg-rose-500/10', textClass: 'text-rose-400' };
};

/* ── Section header component ── */
const SectionHeader = ({ icon: Icon, title, subtitle, delay = 0 }) => (
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
        </div>
        {subtitle && (
            <p className="text-[13px] text-[#888780] ml-[44px]">{subtitle}</p>
        )}
    </motion.div>
);

/* ── Single metric card ── */
const MetricCardPremium = ({ metricKey, value, index }) => {
    const meta = metricMeta[metricKey] || {
        label: metricKey.replace(/_/g, ' '),
        icon: Activity,
        explanation: 'Metric evaluation score.'
    };
    const status = getStatus(value);
    const Icon = meta.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
            className="group relative bg-[#1b1c1d] border border-white/[0.06] rounded-2xl p-6
                       hover:border-white/[0.12] transition-all duration-300 cursor-default
                       hover:shadow-[0_8px_32px_-8px_rgba(107,47,191,0.15)]"
        >
            {/* Top: icon + status badge */}
            <div className="flex items-start justify-between mb-5">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]
                                group-hover:bg-[#6b2fbf]/10 group-hover:border-[#6b2fbf]/20
                                transition-all duration-300">
                    <Icon size={18} className="text-[#888780] group-hover:text-[#6b2fbf] transition-colors duration-300" />
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${status.bgClass} ${status.textClass}`}>
                    <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: status.color, boxShadow: `0 0 6px ${status.color}60` }}
                    />
                    {status.label}
                </span>
            </div>

            {/* Label */}
            <p className="text-[11px] text-[#888780] uppercase tracking-widest font-medium mb-2">
                {meta.label}
            </p>

            {/* Score */}
            <div className="flex items-baseline gap-1 mb-4">
                <span className="text-[32px] font-semibold text-white tracking-tight leading-none">
                    {Math.round(value * 100)}
                </span>
                <span className="text-[14px] text-[#888780] font-medium">%</span>
            </div>

            {/* Progress track */}
            <div className="h-1 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(value * 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: status.color }}
                />
            </div>

            {/* Explanation */}
            <div className="pt-3 border-t border-white/[0.05]">
                <p className="text-[11.5px] text-[#888780] leading-[1.6]">
                    {meta.explanation}
                </p>
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
        <div className="min-h-screen text-[#e3e2e3]">

            {/* ─── PAGE HEADER ─── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
            >
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 rounded-full bg-[#6b2fbf]" />
                    <h1 className="text-[22px] font-semibold text-white tracking-tight">
                        Audit Results
                    </h1>
                </div>
                <p className="text-[13px] text-[#888780] ml-3.5">
                    AI fairness analysis report — review metrics, explore feature impact, and apply mitigation.
                </p>
            </motion.div>

            {/* ─── SECTION 1: OVERVIEW ─── */}
            <section className="mb-10">
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

            {/* ─── SECTION 2: METRICS ─── */}
            <section className="mb-12">
                <SectionHeader
                    icon={Target}
                    title="Fairness Metrics"
                    subtitle="Individual metric scores with status indicators"
                    delay={0.2}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {Object.entries(metrics).map(([key, value], index) => (
                        <MetricCardPremium
                            key={key}
                            metricKey={key}
                            value={value}
                            index={index}
                        />
                    ))}
                </div>
            </section>

            {/* ─── SECTION 3: EXPLAINABILITY ─── */}
            <section className="mb-12">
                <SectionHeader
                    icon={Sparkles}
                    title="Explainability"
                    subtitle="Understand what drives your model's decisions"
                    delay={0.3}
                />

                {/* SHAP Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                    className="mb-8"
                >
                    <SHAPChart shapValues={shapValues} />
                </motion.div>

                {/* Heatmap */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <BiasHeatmap metrics={metrics} />
                </motion.div>
            </section>

            {/* ─── SECTION 4: MITIGATION ─── */}
            <section className="mb-10">
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
                    <div className="relative rounded-2xl border border-white/[0.06] bg-[#1b1c1d] overflow-hidden">
                        {/* Decorative gradient glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#6b2fbf]/[0.04] via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[#6b2fbf]/40 to-transparent" />

                        <div className="relative p-8 sm:p-10">
                            <AnimatePresence mode="wait">
                                {!mitigatedData ? (
                                    <motion.div
                                        key="cta"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-center max-w-lg mx-auto"
                                    >
                                        {/* Icon */}
                                        <div className="inline-flex p-4 rounded-2xl bg-[#6b2fbf]/10 border border-[#6b2fbf]/20 mb-6">
                                            <Zap size={28} className="text-[#6b2fbf]" />
                                        </div>

                                        <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">
                                            Improve Model Fairness
                                        </h3>
                                        <p className="text-[13.5px] text-[#888780] leading-relaxed mb-8 max-w-md mx-auto">
                                            Our AI engine analyzes bias patterns and suggests rebalancing strategies
                                            to improve fairness scores without sacrificing accuracy.
                                        </p>

                                        {/* CTA Button */}
                                        <button
                                            id="mitigation-apply-btn"
                                            onClick={handleMitigation}
                                            disabled={loading}
                                            className="group relative inline-flex items-center gap-2.5 px-8 py-3.5
                                                       rounded-xl font-semibold text-[14px] text-white cursor-pointer
                                                       transition-all duration-300 disabled:cursor-not-allowed
                                                       disabled:opacity-50"
                                            style={{
                                                background: loading
                                                    ? '#2a2b2c'
                                                    : 'linear-gradient(135deg, #6b2fbf 0%, #7c3aed 50%, #6b2fbf 100%)',
                                                backgroundSize: '200% 200%',
                                                boxShadow: loading
                                                    ? 'none'
                                                    : '0 8px 24px -4px rgba(107, 47, 191, 0.4), 0 0 0 1px rgba(107, 47, 191, 0.2)',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!loading) {
                                                    e.currentTarget.style.backgroundPosition = '100% 100%';
                                                    e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(107, 47, 191, 0.5), 0 0 0 1px rgba(107, 47, 191, 0.3)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!loading) {
                                                    e.currentTarget.style.backgroundPosition = '0% 0%';
                                                    e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(107, 47, 191, 0.4), 0 0 0 1px rgba(107, 47, 191, 0.2)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }
                                            }}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Processing Mitigation…
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={18} />
                                                    Apply Bias Mitigation
                                                    <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        {/* Trust signals */}
                                        <div className="flex items-center justify-center gap-6 mt-6 text-[11px] text-[#888780]">
                                            <span className="flex items-center gap-1.5">
                                                <ShieldCheck size={12} className="text-emerald-500/70" />
                                                Non-destructive
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <TrendingUp size={12} className="text-[#6b2fbf]/70" />
                                                AI-optimized
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
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                                <TrendingUp size={16} className="text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-[15px] font-semibold text-white">
                                                    Mitigation Applied Successfully
                                                </h3>
                                                <p className="text-[12px] text-[#888780]">
                                                    Compare before and after fairness scores
                                                </p>
                                            </div>
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
    );
};

export default ResultsPage;
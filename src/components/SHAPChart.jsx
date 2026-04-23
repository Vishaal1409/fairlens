import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const value = payload[0].value;
    const isPositive = value >= 0;
    return (
        <div style={{
            background: 'rgba(27, 28, 29, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 12px 40px -8px rgba(0,0,0,0.6)',
            minWidth: '160px',
        }}>
            <p style={{ fontSize: '12px', color: '#e3e2e3', fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                {label}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: isPositive ? '#5BC0EB' : '#FF6E6E',
                    boxShadow: `0 0 6px ${isPositive ? '#5BC0EB60' : '#FF6E6E60'}`,
                    flexShrink: 0,
                }} />
                <span style={{
                    fontSize: '11px',
                    color: isPositive ? '#5BC0EB' : '#FF6E6E',
                    fontWeight: 600,
                }}>
                    SHAP: {value > 0 ? '+' : ''}{value.toFixed(3)}
                </span>
            </div>
            <p style={{ fontSize: '10px', color: '#8B93A8', margin: '6px 0 0', lineHeight: 1.4 }}>
                {isPositive ? 'Pushes prediction higher' : 'Pushes prediction lower'}
            </p>
        </div>
    );
};

/* ═══════════════════════════════════════
   SHAP CHART — Data Story Panel
   ═══════════════════════════════════════ */
const SHAPChart = ({ shapValues }) => {
    // Guard: shapValues must be a non-null plain object with at least one key
    if (!shapValues || typeof shapValues !== 'object' || Array.isArray(shapValues) || Object.keys(shapValues).length === 0) {
        return (
            <div className="glass rounded-3xl p-10 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-obs-dim">
                SHAP data unavailable
            </div>
        );
    }

    const data = Object.entries(shapValues)
        .map(([feature, value]) => ({
            feature: feature.replace(/_/g, ' '),
            value,
            absValue: Math.abs(value),
        }))
        .sort((a, b) => b.absValue - a.absValue)
        .slice(0, 10);

    const positiveCount = data.filter(d => d.value >= 0).length;
    const negativeCount = data.length - positiveCount;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass frame-mark relative rounded-3xl overflow-hidden transition-all duration-300"
        >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#5BC0EB]/30 to-transparent" />

            <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-[#5BC0EB]/10 border border-[#5BC0EB]/20 flex-shrink-0">
                            <Sparkles size={16} className="text-[#5BC0EB]" />
                        </div>
                        <div>
                            <h3 className="text-[16px] font-semibold text-white tracking-tight mb-0.5">
                                Feature Importance (SHAP)
                            </h3>
                            <p className="text-[12px] text-[#8B93A8] leading-relaxed">
                                How each feature influences model decisions — ranked by impact magnitude
                            </p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
                            <TrendingUp size={12} className="text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-medium">{positiveCount} Positive</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/[0.06] border border-rose-500/10">
                            <TrendingDown size={12} className="text-rose-400" />
                            <span className="text-[10px] text-rose-400 font-medium">{negativeCount} Negative</span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.05] mb-6" />

                {/* Chart — custom spring-animated bars */}
                <div className="space-y-2.5">
                    {data.map((entry, i) => {
                        const isPos = entry.value >= 0;
                        const barColor = isPos ? '#6366f1' : '#f43f5e';
                        const absMax = Math.max(...data.map(d => d.absValue));
                        const widthPct = (entry.absValue / absMax) * 100;
                        return (
                            <div key={entry.feature} className="flex items-center gap-3 group/bar">
                                {/* Feature label */}
                                <div className="w-28 flex-shrink-0 text-right">
                                    <span className="text-[11px] font-medium text-[#E8EAF0] capitalize leading-tight">
                                        {entry.feature}
                                    </span>
                                </div>

                                {/* Zero line + bar track */}
                                <div className="flex-1 relative h-7 flex items-center">
                                    {/* Track */}
                                    <div className="absolute inset-0 rounded-full bg-white/[0.04]" />
                                    {/* Animated bar */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${widthPct}%` }}
                                        viewport={{ once: true }}
                                        transition={{ type: 'spring', stiffness: 80, damping: 18, delay: i * 0.06 }}
                                        className="absolute left-0 top-1 bottom-1 rounded-full"
                                        style={{
                                            backgroundColor: barColor,
                                            opacity: 0.82,
                                            boxShadow: `0 0 10px ${barColor}40`,
                                        }}
                                    />
                                    {/* Value label */}
                                    <span
                                        className="absolute right-2 text-[10px] font-mono font-semibold z-10"
                                        style={{ color: barColor }}
                                    >
                                        {entry.value > 0 ? '+' : ''}{entry.value.toFixed(3)}
                                    </span>
                                </div>

                                {/* Direction dot */}
                                <div
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: barColor, boxShadow: `0 0 6px ${barColor}` }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Insight callout */}
                <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[11.5px] text-[#8B93A8] leading-[1.7]">
                        <span className="text-[#E8EAF0] font-medium">Key Insight: </span>
                        <span className="capitalize font-medium" style={{ color: data[0]?.value >= 0 ? '#6366f1' : '#f43f5e' }}>
                            {data[0]?.feature}
                        </span>
                        {' '}has the strongest influence on model predictions with a SHAP value of{' '}
                        <span className="font-mono text-[#E8EAF0]">
                            {data[0]?.value > 0 ? '+' : ''}{data[0]?.value?.toFixed(3)}
                        </span>.
                        Features with negative values push predictions toward unfavorable outcomes for certain groups.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default SHAPChart;
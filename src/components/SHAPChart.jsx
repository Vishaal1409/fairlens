import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
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
                    backgroundColor: isPositive ? '#1D9E75' : '#E24B4A',
                    boxShadow: `0 0 6px ${isPositive ? '#1D9E7560' : '#E24B4A60'}`,
                    flexShrink: 0,
                }} />
                <span style={{
                    fontSize: '11px',
                    color: isPositive ? '#1D9E75' : '#E24B4A',
                    fontWeight: 600,
                }}>
                    SHAP: {value > 0 ? '+' : ''}{value.toFixed(3)}
                </span>
            </div>
            <p style={{ fontSize: '10px', color: '#888780', margin: '6px 0 0', lineHeight: 1.4 }}>
                {isPositive ? 'Pushes prediction higher' : 'Pushes prediction lower'}
            </p>
        </div>
    );
};

/* ═══════════════════════════════════════
   SHAP CHART — Data Story Panel
   ═══════════════════════════════════════ */
const SHAPChart = ({ shapValues }) => {
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
            className="relative bg-[#1b1c1d] border border-white/[0.06] rounded-2xl overflow-hidden
                       transition-all duration-300 hover:border-white/[0.1]
                       hover:shadow-[0_8px_32px_-8px_rgba(107,47,191,0.1)]"
        >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#6b2fbf]/30 to-transparent" />

            <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-[#6b2fbf]/10 border border-[#6b2fbf]/20 flex-shrink-0">
                            <Sparkles size={16} className="text-[#6b2fbf]" />
                        </div>
                        <div>
                            <h3 className="text-[16px] font-semibold text-white tracking-tight mb-0.5">
                                Feature Importance (SHAP)
                            </h3>
                            <p className="text-[12px] text-[#888780] leading-relaxed">
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

                {/* Chart */}
                <ResponsiveContainer width="100%" height={360}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 0, right: 32, left: 12, bottom: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.03)"
                            horizontal={false}
                        />
                        <ReferenceLine
                            x={0}
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth={1}
                        />
                        <XAxis
                            type="number"
                            tick={{ fontSize: 10, fill: '#888780', fontFamily: 'Inter' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => v.toFixed(2)}
                        />
                        <YAxis
                            type="category"
                            dataKey="feature"
                            tick={{ fontSize: 12, fill: '#cac4d0', fontFamily: 'Inter', fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            width={120}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 4 }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={entry.value >= 0 ? '#1D9E75' : '#E24B4A'}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                {/* Insight callout */}
                <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <p className="text-[11.5px] text-[#888780] leading-[1.7]">
                        <span className="text-[#cac4d0] font-medium">Key Insight: </span>
                        <span className="capitalize font-medium" style={{ color: data[0]?.value >= 0 ? '#1D9E75' : '#E24B4A' }}>
                            {data[0]?.feature}
                        </span>
                        {' '}has the strongest influence on model predictions with a SHAP value of{' '}
                        <span className="font-mono text-[#cac4d0]">
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
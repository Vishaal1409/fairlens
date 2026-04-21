import React from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, ArrowUpRight, CheckCircle2 } from 'lucide-react';

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'rgba(27, 28, 29, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 12px 40px -8px rgba(0,0,0,0.6)',
        }}>
            <p style={{ fontSize: '12px', color: '#e3e2e3', fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                {label}
            </p>
            {payload.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: entry.color,
                        boxShadow: `0 0 6px ${entry.color}60`,
                    }} />
                    <span style={{
                        fontSize: '11px',
                        color: entry.color,
                        fontWeight: 500,
                    }}>
                        {entry.name}: {(entry.value * 100).toFixed(1)}%
                    </span>
                </div>
            ))}
            {payload.length === 2 && (
                <div style={{
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }}>
                    <ArrowUpRight size={12} style={{ color: '#1D9E75' }} />
                    <span style={{ fontSize: '10px', color: '#1D9E75', fontWeight: 600 }}>
                        +{((payload[1].value - payload[0].value) * 100).toFixed(1)}% improvement
                    </span>
                </div>
            )}
        </div>
    );
};

/* ── Custom Legend ── */
const CustomLegend = ({ payload }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px' }}>
        {payload?.map((entry, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: entry.color,
                    boxShadow: `0 0 6px ${entry.color}60`,
                }} />
                <span style={{ fontSize: '11px', color: '#888780', fontWeight: 500 }}>
                    {entry.value}
                </span>
            </div>
        ))}
    </div>
);

/* ═══════════════════════════════════════
   BEFORE / AFTER CHART
   ═══════════════════════════════════════ */
const BeforeAfterChart = ({ data }) => {
    const defaultData = [
        { metric: 'Demographic Parity', before: 0.5, after: 0.8 },
    ];
    const chartData = data || defaultData;

    /* Compute summary */
    const totalImprovement = chartData.reduce((sum, d) => sum + (d.after - d.before), 0) / chartData.length;

    return (
        <div className="space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {chartData.map((d, i) => {
                    const improvement = ((d.after - d.before) * 100).toFixed(1);
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                        >
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-[#888780] uppercase tracking-widest font-medium truncate">
                                    {d.metric}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[14px] font-bold text-white">
                                        {Math.round(d.after * 100)}%
                                    </span>
                                    <span className="flex items-center gap-0.5 text-[11px] text-emerald-400 font-semibold">
                                        <ArrowUpRight size={12} />
                                        +{improvement}%
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Chart */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/[0.02] rounded-xl border border-white/[0.05] p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[13px] font-semibold text-white tracking-tight">
                        Fairness Score Comparison
                    </h4>
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <TrendingUp size={11} />
                        +{(totalImprovement * 100).toFixed(1)}% avg
                    </span>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
                        barCategoryGap="30%"
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.03)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="metric"
                            tick={{ fontSize: 11, fill: '#888780', fontFamily: 'Inter' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 1]}
                            tick={{ fontSize: 10, fill: '#888780', fontFamily: 'Inter' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${Math.round(v * 100)}%`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Legend content={<CustomLegend />} />
                        <Bar
                            dataKey="before"
                            name="Before Mitigation"
                            fill="#E24B4A"
                            fillOpacity={0.7}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={44}
                        />
                        <Bar
                            dataKey="after"
                            name="After Mitigation"
                            fill="#1D9E75"
                            fillOpacity={0.85}
                            radius={[6, 6, 0, 0]}
                            maxBarSize={44}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>
        </div>
    );
};

export default BeforeAfterChart;
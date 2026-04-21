import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#1b1c1d',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5)',
        }}>
            <p style={{ fontSize: '12px', color: '#e3e2e3', fontWeight: 600, margin: '0 0 6px' }}>
                {label}
            </p>
            {payload.map((entry, i) => (
                <p key={i} style={{
                    fontSize: '11px',
                    color: entry.color,
                    fontWeight: 500,
                    margin: '2px 0',
                }}>
                    {entry.name}: {(entry.value * 100).toFixed(1)}%
                </p>
            ))}
        </div>
    );
};

const CustomLegend = ({ payload }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
        {payload?.map((entry, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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

const BeforeAfterChart = ({ data }) => {
    const defaultData = [
        { metric: 'Demographic Parity', before: 0.5, after: 0.8 },
    ];

    const chartData = data || defaultData;

    return (
        <div className="bg-[#1b1c1d]/50 rounded-xl border border-white/[0.05] p-6">
            <h4 className="text-[14px] font-semibold text-white mb-1 tracking-tight">
                Mitigation Impact
            </h4>
            <p className="text-[12px] text-[#888780] mb-6">
                Before vs after fairness score comparison
            </p>

            <div className="h-px bg-white/[0.05] mb-5" />

            <ResponsiveContainer width="100%" height={280}>
                <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 20, left: 0, bottom: 0 }}
                    barCategoryGap="30%"
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="metric"
                        tick={{ fontSize: 12, fill: '#888780' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 1]}
                        tick={{ fontSize: 11, fill: '#888780' }}
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
                        fillOpacity={0.75}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                    />
                    <Bar
                        dataKey="after"
                        name="After Mitigation"
                        fill="#1D9E75"
                        fillOpacity={0.85}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BeforeAfterChart;
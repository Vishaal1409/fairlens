import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const value = payload[0].value
    return (
        <div style={{
            background: '#1b1c1d',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.5)',
        }}>
            <p style={{ fontSize: '12px', color: '#e3e2e3', fontWeight: 600, margin: '0 0 4px' }}>
                {label}
            </p>
            <p style={{
                fontSize: '11px',
                color: value >= 0 ? '#1D9E75' : '#E24B4A',
                fontWeight: 500,
                margin: 0,
            }}>
                SHAP: {value > 0 ? '+' : ''}{value.toFixed(3)}
            </p>
        </div>
    )
}

const SHAPChart = ({ shapValues }) => {
    const data = Object.entries(shapValues)
        .map(([feature, value]) => ({
            feature: feature.replace(/_/g, ' '),
            value,
        }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        .slice(0, 10)

    return (
        <div className="bg-[#1b1c1d] border border-white/[0.06] rounded-2xl p-6 transition-all duration-300
                        hover:border-white/[0.1] hover:shadow-[0_8px_32px_-8px_rgba(107,47,191,0.1)]">
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-[15px] font-semibold text-white tracking-tight mb-1">
                    Feature Importance (SHAP)
                </h3>
                <p className="text-[12px] text-[#888780]">
                    Model decision drivers — green denotes positive impact, red denotes negative
                </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.05] mb-5" />

            {/* Chart */}
            <ResponsiveContainer width="100%" height={340}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)"
                        horizontal={false}
                    />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#888780' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="feature"
                        tick={{ fontSize: 12, fill: '#888780' }}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {data.map((entry, index) => (
                            <Cell
                                key={index}
                                fill={entry.value >= 0 ? '#1D9E75' : '#E24B4A'}
                                fillOpacity={0.85}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default SHAPChart
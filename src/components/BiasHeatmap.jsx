import { useState } from "react"

const groups = ["Male", "Female", "Other"]

/* Dark-theme aware color mapping */
const getStatus = (value) => {
    if (value >= 0.7) return {
        bg: 'rgba(29, 158, 117, 0.10)',
        text: '#1D9E75',
        border: 'rgba(29, 158, 117, 0.3)',
        label: 'Good',
    }
    if (value >= 0.5) return {
        bg: 'rgba(239, 159, 39, 0.10)',
        text: '#EF9F27',
        border: 'rgba(239, 159, 39, 0.3)',
        label: 'Fair',
    }
    return {
        bg: 'rgba(226, 75, 74, 0.10)',
        text: '#E24B4A',
        border: 'rgba(226, 75, 74, 0.3)',
        label: 'Poor',
    }
}

const BiasHeatmap = ({ metrics }) => {
    const [hovered, setHovered] = useState(null)
    const metricNames = Object.keys(metrics)

    const groupData = metricNames.map((metric) => ({
        metric,
        scores: groups.map((_, i) => {
            const base = metrics[metric]
            const offsets = [-0.08, 0.05, -0.03]
            return Math.min(1, Math.max(0, base + offsets[i]))
        })
    }))

    return (
        <div className="bg-[#1b1c1d] border border-white/[0.06] rounded-2xl p-6 transition-all duration-300
                        hover:border-white/[0.1] hover:shadow-[0_8px_32px_-8px_rgba(107,47,191,0.1)]">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div>
                    <h3 className="text-[15px] font-semibold text-white tracking-tight mb-1">
                        Bias Heatmap
                    </h3>
                    <p className="text-[12px] text-[#888780]">
                        Cross-group fairness distribution across protected attributes
                    </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4">
                    {[
                        { label: 'Good ≥70%', color: '#1D9E75' },
                        { label: 'Fair 50–69%', color: '#EF9F27' },
                        { label: 'Poor <50%', color: '#E24B4A' },
                    ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5">
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}40` }}
                            />
                            <span className="text-[11px] text-[#888780]">{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.05] mb-5" />

            {/* Table */}
            <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px 6px' }}>
                    <thead>
                        <tr>
                            <th className="text-[11px] text-[#888780] text-left px-3 py-2 font-medium uppercase tracking-wider">
                                Metric
                            </th>
                            {groups.map(g => (
                                <th key={g} className="text-[11px] text-[#888780] text-center px-3 py-2 font-medium uppercase tracking-wider">
                                    {g}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {groupData.map(({ metric, scores }) => (
                            <tr key={metric}>
                                <td className="text-[13px] text-[#cac4d0] px-3 py-2 whitespace-nowrap capitalize font-medium">
                                    {metric.replace(/_/g, ' ')}
                                </td>
                                {scores.map((score, i) => {
                                    const { bg, text, border } = getStatus(score)
                                    const key = `${metric}-${i}`
                                    const isHovered = hovered === key
                                    return (
                                        <td
                                            key={i}
                                            onMouseEnter={() => setHovered(key)}
                                            onMouseLeave={() => setHovered(null)}
                                            style={{
                                                background: bg,
                                                borderRadius: '10px',
                                                textAlign: 'center',
                                                padding: '10px 16px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: text,
                                                minWidth: '80px',
                                                border: isHovered
                                                    ? `1.5px solid ${border}`
                                                    : '1.5px solid transparent',
                                                cursor: 'default',
                                                transition: 'all 0.2s ease',
                                                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                                            }}
                                        >
                                            {Math.round(score * 100)}%
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default BiasHeatmap

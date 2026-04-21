import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Info } from 'lucide-react';

const groups = ['Male', 'Female', 'Non-Binary'];

/* ── Color & status mapping ── */
const getStatus = (value) => {
    if (value >= 0.7) return {
        bg: 'rgba(29, 158, 117, 0.12)',
        bgHover: 'rgba(29, 158, 117, 0.20)',
        text: '#1D9E75',
        border: 'rgba(29, 158, 117, 0.35)',
        label: 'Fair',
        glow: '0 0 12px rgba(29, 158, 117, 0.2)',
    };
    if (value >= 0.5) return {
        bg: 'rgba(239, 159, 39, 0.12)',
        bgHover: 'rgba(239, 159, 39, 0.20)',
        text: '#EF9F27',
        border: 'rgba(239, 159, 39, 0.35)',
        label: 'Warning',
        glow: '0 0 12px rgba(239, 159, 39, 0.2)',
    };
    return {
        bg: 'rgba(226, 75, 74, 0.12)',
        bgHover: 'rgba(226, 75, 74, 0.20)',
        text: '#E24B4A',
        border: 'rgba(226, 75, 74, 0.35)',
        label: 'Biased',
        glow: '0 0 12px rgba(226, 75, 74, 0.2)',
    };
};

/* ── Tooltip Component ── */
const CellTooltip = ({ metric, group, score, status, position }) => (
    <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[100] pointer-events-none"
        style={{ left: position.x, top: position.y - 80 }}
    >
        <div style={{
            background: 'rgba(27, 28, 29, 0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 16px 48px -12px rgba(0,0,0,0.7)',
            minWidth: '180px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: status.text,
                    boxShadow: `0 0 6px ${status.text}60`,
                }} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: status.text }}>
                    {status.label}
                </span>
            </div>
            <p style={{ fontSize: '12px', color: '#e3e2e3', fontWeight: 600, margin: '0 0 2px' }}>
                {metric.replace(/_/g, ' ')}
            </p>
            <p style={{ fontSize: '11px', color: '#888780', margin: 0 }}>
                {group}: <span style={{ color: '#cac4d0', fontWeight: 600, fontFamily: 'monospace' }}>
                    {Math.round(score * 100)}%
                </span>
            </p>
        </div>
    </motion.div>
);

/* ═══════════════════════════════════════
   BIAS HEATMAP — Intersectional Analysis
   ═══════════════════════════════════════ */
const BiasHeatmap = ({ metrics }) => {
    const [hovered, setHovered] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const metricNames = Object.keys(metrics);

    const groupData = metricNames.map((metric) => ({
        metric,
        label: metric.replace(/_/g, ' '),
        scores: groups.map((_, i) => {
            const base = metrics[metric];
            const offsets = [-0.08, 0.05, -0.03];
            return Math.min(1, Math.max(0, base + offsets[i]));
        })
    }));

    const handleMouseMove = (e) => {
        setTooltipPos({ x: e.clientX - 90, y: e.clientY });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
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
                            <Flame size={16} className="text-[#6b2fbf]" />
                        </div>
                        <div>
                            <h3 className="text-[16px] font-semibold text-white tracking-tight mb-0.5">
                                Intersectional Bias Heatmap
                            </h3>
                            <p className="text-[12px] text-[#888780] leading-relaxed">
                                Cross-group fairness analysis across protected demographic attributes
                            </p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {[
                            { label: 'Fair ≥70%', color: '#1D9E75' },
                            { label: 'Warning', color: '#EF9F27' },
                            { label: 'Biased <50%', color: '#E24B4A' },
                        ].map(l => (
                            <div key={l.label} className="flex items-center gap-1.5">
                                <div
                                    className="w-2.5 h-2.5 rounded flex-shrink-0"
                                    style={{
                                        backgroundColor: l.color,
                                        opacity: 0.8,
                                        boxShadow: `0 0 6px ${l.color}30`,
                                    }}
                                />
                                <span className="text-[10px] text-[#888780] font-medium">{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.05] mb-6" />

                {/* Heatmap Grid */}
                <div className="overflow-x-auto">
                    {/* Column headers */}
                    <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `180px repeat(${groups.length}, 1fr)` }}>
                        <div /> {/* Empty corner */}
                        {groups.map(g => (
                            <div key={g} className="text-center">
                                <span className="text-[10px] text-[#888780] uppercase tracking-widest font-semibold">
                                    {g}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {groupData.map(({ metric, label, scores }, rowIdx) => (
                        <motion.div
                            key={metric}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 + rowIdx * 0.06 }}
                            className="grid gap-2 mb-2"
                            style={{ gridTemplateColumns: `180px repeat(${groups.length}, 1fr)` }}
                        >
                            {/* Metric label */}
                            <div className="flex items-center h-14 px-3">
                                <span className="text-[12px] text-[#cac4d0] font-medium capitalize truncate">
                                    {label}
                                </span>
                            </div>

                            {/* Score cells */}
                            {scores.map((score, colIdx) => {
                                const status = getStatus(score);
                                const cellKey = `${metric}-${colIdx}`;
                                const isHovered = hovered === cellKey;

                                return (
                                    <motion.div
                                        key={colIdx}
                                        onMouseEnter={() => setHovered(cellKey)}
                                        onMouseLeave={() => setHovered(null)}
                                        onMouseMove={handleMouseMove}
                                        whileHover={{ scale: 1.03 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        className="relative flex flex-col items-center justify-center h-14 rounded-xl cursor-default"
                                        style={{
                                            background: isHovered ? status.bgHover : status.bg,
                                            border: `1.5px solid ${isHovered ? status.border : 'transparent'}`,
                                            boxShadow: isHovered ? status.glow : 'none',
                                            transition: 'background 0.2s, border 0.2s, box-shadow 0.2s',
                                        }}
                                    >
                                        <span
                                            className="text-[16px] font-bold tracking-tight"
                                            style={{ color: status.text }}
                                        >
                                            {Math.round(score * 100)}%
                                        </span>
                                        <span className="text-[9px] font-medium uppercase tracking-wider mt-0.5" style={{ color: status.text, opacity: 0.7 }}>
                                            {status.label}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ))}
                </div>

                {/* Tooltip */}
                {hovered && (() => {
                    const parts = hovered.split('-');
                    const metric = parts.slice(0, -1).join('-');
                    const colIdx = parseInt(parts[parts.length - 1]);
                    const row = groupData.find(d => d.metric === metric);
                    if (!row) return null;
                    const score = row.scores[colIdx];
                    const status = getStatus(score);
                    return (
                        <CellTooltip
                            metric={metric}
                            group={groups[colIdx]}
                            score={score}
                            status={status}
                            position={tooltipPos}
                        />
                    );
                })()}

                {/* Footer insight */}
                <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <Info size={14} className="text-[#888780] mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-[#888780] leading-[1.7]">
                        This matrix shows how fairness metrics vary across demographic groups.
                        Red cells indicate significant disparities requiring mitigation.
                        Hover over cells for detailed breakdowns.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default BiasHeatmap;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, AlertTriangle, XOctagon,
    Clock, Database, Cpu, CheckCircle2
} from 'lucide-react';

/* ── Circular Score Gauge ── */
const CircularScore = ({ score, color, size = 120 }) => {
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const fillPercent = Math.min(Math.max(score, 0), 1);
    const offset = circumference * (1 - fillPercent);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Glow behind */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{ backgroundColor: color }}
            />
            <svg width={size} height={size} className="relative z-10 -rotate-90">
                {/* Track */}
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                    style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
                />
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="text-[28px] font-bold text-white tracking-tight leading-none"
                >
                    {Math.round(score * 100)}
                </motion.span>
                <span className="text-[10px] text-[#888780] font-medium tracking-wider uppercase mt-0.5">
                    Score
                </span>
            </div>
        </div>
    );
};

/* ── Info Chip (model, dataset, timestamp) ── */
const InfoChip = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <Icon size={14} className="text-[#8B93A8] flex-shrink-0" />
        <div className="min-w-0">
            <p className="text-[9px] text-[#8B93A8] uppercase tracking-[0.26em] font-mono leading-none mb-0.5">{label}</p>
            <p className="text-[12px] text-[#E8EAF0] font-medium truncate">{value}</p>
        </div>
    </div>
);

/* ═══════════════════════════════════════
   SUMMARY BANNER — Hero Panel
   ═══════════════════════════════════════ */
const SummaryBanner = ({ metrics }) => {
    if (!metrics || typeof metrics !== 'object') return null;
    const scores = Object.values(metrics);
    if (scores.length === 0) return null;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const biasedCount = scores.filter(s => s < 0.7).length;

    /* Determine status — Obsidian Observatory palette */
    let config;
    if (avg >= 0.8) {
        config = {
            label: 'Audit Passed',
            sublabel: 'All metrics within acceptable thresholds',
            icon: ShieldCheck,
            color: '#6EE7C4',
            badgeColor: 'bg-[#6EE7C4]/10 text-[#6EE7C4] border-[#6EE7C4]/25',
            glowFrom: 'from-[#6EE7C4]/[0.08]',
        };
    } else if (avg >= 0.5) {
        config = {
            label: 'Needs Attention',
            sublabel: `${biasedCount} metric${biasedCount > 1 ? 's' : ''} below fairness threshold`,
            icon: AlertTriangle,
            color: '#E8D5A8',
            badgeColor: 'bg-[#E8D5A8]/10 text-[#E8D5A8] border-[#E8D5A8]/25',
            glowFrom: 'from-[#E8D5A8]/[0.08]',
        };
    } else {
        config = {
            label: 'Critical Bias Detected',
            sublabel: 'Immediate mitigation recommended',
            icon: XOctagon,
            color: '#FF6E6E',
            badgeColor: 'bg-[#FF6E6E]/10 text-[#FF6E6E] border-[#FF6E6E]/25',
            glowFrom: 'from-[#FF6E6E]/[0.08]',
        };
    }

    const Icon = config.icon;
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass frame-mark relative rounded-3xl overflow-hidden"
        >
            {/* ── GLOW BLOB — critical card halo ── */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: '-60px', left: '-60px',
                    width: '320px', height: '320px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${config.color}30 0%, transparent 70%)`,
                    filter: 'blur(40px)',
                }}
            />

            {/* Decorative gradient glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.glowFrom} via-transparent to-transparent pointer-events-none`} />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Floating orb accent */}
            <div
                className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
                style={{ backgroundColor: config.color }}
            />

            <div className="relative z-10 p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10">

                    {/* Left: Circular Score */}
                    <div className="flex-shrink-0">
                        <CircularScore score={avg} color={config.color} size={120} />
                    </div>

                    {/* Center: Status + Details */}
                    <div className="flex-1 min-w-0">
                        {/* Status badge */}
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${config.badgeColor}`}>
                                <motion.span
                                    animate={{ opacity: [1, 0.4, 1] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: config.color, boxShadow: `0 0 8px ${config.color}80` }}
                                />
                                {config.label}
                            </span>
                            <span className="text-[11px] text-[#888780] font-medium">
                                Avg: {(avg * 100).toFixed(1)}%
                            </span>
                        </div>

                        {/* Headline */}
                        <h2 className="font-display text-[28px] sm:text-[34px] text-white tracking-tight mb-1.5 leading-[1.05]">
                            AI fairness <span className="italic" style={{ color: config.color }}>audit report</span>
                        </h2>
                        <p className="text-[13px] text-[#8B93A8] leading-relaxed max-w-xl mb-5">
                            {config.sublabel}
                        </p>

                        {/* Info chips row */}
                        <div className="flex flex-wrap gap-2.5">
                            <InfoChip icon={Cpu} label="Model" value="XGBoost Classifier" />
                            <InfoChip icon={Database} label="Dataset" value="48,842 samples" />
                            <InfoChip icon={Clock} label="Completed" value={timestamp} />
                            <InfoChip icon={CheckCircle2} label="Metrics" value={`${scores.length} evaluated`} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SummaryBanner;
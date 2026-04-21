import React from 'react';
import { ShieldCheck, AlertTriangle, XOctagon } from 'lucide-react';

const SummaryBanner = ({ metrics }) => {
    const scores = Object.values(metrics);
    if (scores.length === 0) return null;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    let config = {};

    if (avg >= 0.8) {
        config = {
            label: 'Fair',
            description: 'Your model performs within acceptable fairness thresholds.',
            icon: ShieldCheck,
            wrapper: 'bg-emerald-500/[0.06] border-emerald-500/20',
            text: 'text-emerald-400',
            dot: '#1D9E75',
            iconColor: 'text-emerald-400',
        };
    } else if (avg >= 0.5) {
        config = {
            label: 'Moderately Biased',
            description: 'Some metrics fall below ideal thresholds — review recommended.',
            icon: AlertTriangle,
            wrapper: 'bg-amber-500/[0.06] border-amber-500/20',
            text: 'text-amber-400',
            dot: '#EF9F27',
            iconColor: 'text-amber-400',
        };
    } else {
        config = {
            label: 'Highly Biased',
            description: 'Significant bias detected — immediate mitigation recommended.',
            icon: XOctagon,
            wrapper: 'bg-rose-500/[0.06] border-rose-500/20',
            text: 'text-rose-400',
            dot: '#E24B4A',
            iconColor: 'text-rose-400',
        };
    }

    const Icon = config.icon;

    return (
        <div className={`p-5 rounded-2xl border flex items-start gap-4 ${config.wrapper}`}>
            {/* Icon */}
            <div className={`p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] flex-shrink-0`}>
                <Icon size={20} className={config.iconColor} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: config.dot, boxShadow: `0 0 8px ${config.dot}50` }}
                    />
                    <span className="text-[11px] text-[#888780] font-medium tracking-widest uppercase">
                        Overall Verdict
                    </span>
                </div>
                <div className={`text-[16px] font-semibold tracking-tight mb-0.5 ${config.text}`}>
                    {config.label}
                    <span className="text-[13px] font-medium text-[#888780] ml-2">
                        — Avg Score: {avg.toFixed(2)}
                    </span>
                </div>
                <p className="text-[12px] text-[#888780] leading-relaxed mt-1">
                    {config.description}
                </p>
            </div>
        </div>
    );
};

export default SummaryBanner;
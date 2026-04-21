import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Renders the delta (%) between two metric scores with directional
 * trend icon and color-coded severity.
 *
 * @param {{ scoreA: number, scoreB: number, significant?: boolean, compact?: boolean }} props
 *   - significant: true if |delta| > 15% → uses alert styling
 *   - compact: smaller variant for inline usage
 */
const DeltaIndicator = ({ scoreA, scoreB, significant, compact = false }) => {
  const delta = scoreB - scoreA; // positive = B is better
  const deltaPct = Math.round(Math.abs(delta) * 100);
  const isSignificant = significant ?? Math.abs(delta) > 0.15;

  // Decide direction
  const direction = delta > 0.005 ? 'up' : delta < -0.005 ? 'down' : 'neutral';

  const config = {
    up: {
      icon: <TrendingUp className={compact ? 'w-3 h-3' : 'w-4 h-4'} />,
      label: `+${deltaPct}%`,
      text: isSignificant ? 'text-emerald-400' : 'text-emerald-400/70',
      bg: isSignificant ? 'bg-emerald-500/15' : 'bg-emerald-500/8',
      ring: isSignificant ? 'ring-1 ring-emerald-500/25' : '',
    },
    down: {
      icon: <TrendingDown className={compact ? 'w-3 h-3' : 'w-4 h-4'} />,
      label: `-${deltaPct}%`,
      text: isSignificant ? 'text-rose-400' : 'text-rose-400/70',
      bg: isSignificant ? 'bg-rose-500/15' : 'bg-rose-500/8',
      ring: isSignificant ? 'ring-1 ring-rose-500/25 delta-alert-glow' : '',
    },
    neutral: {
      icon: <Minus className={compact ? 'w-3 h-3' : 'w-4 h-4'} />,
      label: '0%',
      text: 'text-gray-500',
      bg: 'bg-white/5',
      ring: '',
    },
  };

  const c = config[direction];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        inline-flex items-center gap-1.5 font-mono tabular-nums
        ${compact ? 'px-2 py-0.5 text-[10px] rounded-md' : 'px-3 py-1.5 text-xs rounded-lg'}
        ${c.bg} ${c.text} ${c.ring}
      `}
    >
      {c.icon}
      <span className="font-semibold">{c.label}</span>
    </motion.div>
  );
};

export default DeltaIndicator;

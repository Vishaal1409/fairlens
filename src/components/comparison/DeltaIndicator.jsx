import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Renders the absolute delta (%) between two metric scores with directional
 * trend icon and color-coded severity. Applies `.delta-alert-glow` when
 * the drift exceeds the significance threshold (default 15%).
 *
 * @param {{
 *   scoreA: number,
 *   scoreB: number,
 *   significant?: boolean,
 *   compact?: boolean,
 *   threshold?: number
 * }} props
 */
const DeltaIndicator = ({
  scoreA,
  scoreB,
  significant,
  compact = false,
  threshold = 0.15,
}) => {
  const delta    = scoreB - scoreA;           // positive = B improved
  const absDelta = Math.abs(delta);
  const deltaPct = Math.round(absDelta * 100);

  // Allow caller to override; otherwise auto-derive
  const isSignificant = significant ?? absDelta > threshold;

  const direction =
    delta >  0.005 ? 'up'   :
    delta < -0.005 ? 'down' :
    'neutral';

  const iconSize = compact ? 'w-3 h-3' : 'w-4 h-4';

  const config = {
    up: {
      icon:  <TrendingUp  className={iconSize} />,
      label: `+${deltaPct}%`,
      text:  isSignificant ? 'text-emerald-400' : 'text-emerald-400/70',
      bg:    isSignificant ? 'bg-emerald-500/15' : 'bg-emerald-500/8',
      ring:  isSignificant ? 'ring-1 ring-emerald-500/30' : '',
      glow:  '',   // improvements don't pulse — only regressions alert
    },
    down: {
      icon:  <TrendingDown className={iconSize} />,
      label: `-${deltaPct}%`,
      text:  isSignificant ? 'text-rose-400' : 'text-rose-400/70',
      bg:    isSignificant ? 'bg-rose-500/15' : 'bg-rose-500/8',
      ring:  isSignificant ? 'ring-1 ring-rose-500/25' : '',
      glow:  isSignificant ? 'delta-alert-glow' : '',
    },
    neutral: {
      icon:  <Minus className={iconSize} />,
      label: '—',
      text:  'text-gray-500',
      bg:    'bg-white/5',
      ring:  '',
      glow:  '',
    },
  };

  const c = config[direction];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      title={`Delta A→B: ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`}
      className={[
        'inline-flex items-center gap-1.5 font-mono tabular-nums',
        compact
          ? 'px-2 py-0.5 text-[10px] rounded-md'
          : 'px-3 py-1.5 text-xs rounded-lg',
        c.bg,
        c.text,
        c.ring,
        c.glow,
      ].join(' ')}
    >
      {c.icon}
      <span className="font-semibold">{c.label}</span>
    </motion.div>
  );
};

export default DeltaIndicator;

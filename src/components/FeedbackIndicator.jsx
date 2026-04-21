import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

const STATUS = {
  idle: {
    label: 'Ready',
    dot: 'bg-white/25',
    glow: 'shadow-[0_0_0_1px_rgba(255,255,255,0.10),_0_0_24px_rgba(255,255,255,0.06)]',
    icon: null,
  },
  uploading: {
    label: 'Uploading',
    dot: 'bg-[--color-primary]',
    glow: 'shadow-[0_0_0_1px_rgba(0,229,255,0.22),_0_0_34px_rgba(0,229,255,0.22)]',
    icon: <Loader2 size={14} className="text-[--color-primary] animate-spin" />,
  },
  analyzing: {
    label: 'Analyzing',
    dot: 'bg-[--color-warning]',
    glow: 'shadow-[0_0_0_1px_rgba(163,255,18,0.22),_0_0_34px_rgba(163,255,18,0.18)]',
    icon: <Loader2 size={14} className="text-[--color-warning] animate-spin" />,
  },
  done: {
    label: 'Complete',
    dot: 'bg-[--color-success]',
    glow: 'shadow-[0_0_0_1px_rgba(29,233,182,0.22),_0_0_34px_rgba(29,233,182,0.18)]',
    icon: <CheckCircle2 size={14} className="text-[--color-success]" />,
  },
  error: {
    label: 'Error',
    dot: 'bg-[--color-error]',
    glow: 'shadow-[0_0_0_1px_rgba(255,61,90,0.24),_0_0_34px_rgba(255,61,90,0.18)]',
    icon: <XCircle size={14} className="text-[--color-error]" />,
  },
  warning: {
    label: 'Attention',
    dot: 'bg-[--color-warning]',
    glow: 'shadow-[0_0_0_1px_rgba(163,255,18,0.22),_0_0_34px_rgba(163,255,18,0.18)]',
    icon: <AlertTriangle size={14} className="text-[--color-warning]" />,
  },
};

export default function FeedbackIndicator({ status = 'idle', message }) {
  const s = STATUS[status] ?? STATUS.idle;

  return (
    <div
      className={[
        'flex items-center justify-between gap-3 rounded-2xl px-4 py-3',
        'bg-white/[0.02] border border-white/[0.06]',
        'backdrop-blur-xl',
        s.glow,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={['w-2.5 h-2.5 rounded-full', s.dot].join(' ')} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-white tracking-tight">
            {message ?? s.label}
          </p>
          <p className="text-[10px] text-white/55 font-mono truncate">
            Feedback Indicator
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {s.icon}
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/55">
          {status}
        </span>
      </div>
    </div>
  );
}


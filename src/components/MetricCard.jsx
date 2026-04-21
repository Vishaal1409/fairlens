import { Activity } from 'lucide-react'

const getStatus = (score) => {
  if (score >= 0.7) return {
    label: 'Fair',
    color: '#1D9E75',
    bg: 'rgba(29, 158, 117, 0.10)',
    textClass: 'text-emerald-400',
  }
  if (score >= 0.5) return {
    label: 'Moderate',
    color: '#EF9F27',
    bg: 'rgba(239, 159, 39, 0.10)',
    textClass: 'text-amber-400',
  }
  return {
    label: 'High Bias',
    color: '#E24B4A',
    bg: 'rgba(226, 75, 74, 0.10)',
    textClass: 'text-rose-400',
  }
}

export default function MetricCard({ name, score, status: statusOverride }) {
  const resolvedStatus = getStatus(score)
  const displayScore = typeof score === 'number'
    ? `${Math.round(score * 100)}%`
    : score

  return (
    <div className="group bg-[#1b1c1d] border border-white/[0.06] rounded-2xl p-6
                    hover:border-white/[0.12] transition-all duration-300 cursor-default
                    hover:shadow-[0_8px_32px_-8px_rgba(107,47,191,0.15)]">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] text-[#888780] uppercase tracking-widest font-medium capitalize">
          {name?.replace(/_/g, ' ')}
        </span>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{ background: resolvedStatus.bg, color: resolvedStatus.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: resolvedStatus.color,
              boxShadow: `0 0 6px ${resolvedStatus.color}60`,
            }}
          />
          {resolvedStatus.label}
        </span>
      </div>

      {/* Score */}
      <div className="text-[28px] font-semibold text-white tracking-tight">
        {displayScore}
      </div>
    </div>
  )
}
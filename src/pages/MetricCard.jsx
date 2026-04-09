const statusStyles = {
  good:    "bg-tertiary/10 text-tertiary border-tertiary/30",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  bad:     "bg-error/10 text-error border-error/30",
};

const MetricCard = ({ name = "Metric", score = 0.0, status = "good" }) => {
  return (
    <div className="bg-surface-container rounded-2xl p-8 soft-shadow hover:bg-surface-container-high transition-colors group border border-transparent hover:border-[#6b2fbf]/20">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-bold tracking-tight text-on-surface">{name}</h4>
        <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusStyles[status] || statusStyles.good}`}>
          {status}
        </span>
      </div>
      <span className="text-5xl font-black mono-text text-on-surface group-hover:text-primary transition-colors">
        {typeof score === "number" ? score.toFixed(2) : score}
      </span>
      <div className="mt-6 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full"
          style={{ width: `${Math.min(100, score * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default MetricCard;

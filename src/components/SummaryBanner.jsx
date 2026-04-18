import React from 'react';

const SummaryBanner = ({ metrics }) => {
  const scores = Object.values(metrics);
  if (scores.length === 0) return null;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  let styles = {};
  let label = "";

  if (avg >= 0.8) {
    label = "Fair";
    styles = {
      wrapper: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
    };
  } else if (avg >= 0.5) {
    label = "Moderately Biased";
    styles = {
      wrapper: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
    };
  } else {
    label = "Highly Biased";
    styles = {
      wrapper: "bg-rose-500/10 border-rose-500/20",
      text: "text-rose-400",
      dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
    };
  }

  return (
    <div className={`p-4 rounded-xl border flex items-center gap-3 mb-6 ${styles.wrapper}`}>
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${styles.dot}`} />
      <div>
        <div className="text-[12px] text-[#cac4d0] font-medium tracking-wide uppercase mb-0.5">
          Overall Verdict
        </div>
        <div className={`text-[15px] font-semibold tracking-tight ${styles.text}`}>
          {label} — Avg Score: {avg.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default SummaryBanner;
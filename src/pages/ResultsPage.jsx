import MetricCard from "./MetricCard";

const ResultsPage = () => {
  return (
    <div className="pt-8 px-0 pb-16 w-full">
      {/* Content Area */}
<div className="pt-24 px-12 pb-16 w-full max-w-7xl mx-auto space-y-12">
{/* Hero Stats / Summary Section */}
<section className="grid grid-cols-1 md:grid-cols-3 gap-8">
<div className="bg-surface-container rounded-2xl p-8 soft-shadow group border border-transparent hover:border-[#6b2fbf]/20 transition-all soft-shadow-hover">
<div className="flex justify-between items-center mb-6">
<span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">Overall Fairness Score</span>
<div className="bg-tertiary/10 p-2 rounded-lg">
<span className="material-symbols-outlined text-tertiary text-xl" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
</div>
</div>
<div className="flex items-baseline gap-3">
<span className="text-6xl font-bold mono-text text-on-surface">0.92</span>
<span className="text-tertiary text-base font-bold bg-tertiary/10 px-2 py-0.5 rounded-md">+4.2%</span>
</div>
<div className="mt-8 h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
<div className="h-full bg-gradient-to-r from-primary-container to-primary w-[92%] rounded-full"></div>
</div>
</div>
<div className="bg-surface-container rounded-2xl p-8 soft-shadow border border-transparent hover:border-error/20 transition-all soft-shadow-hover">
<div className="flex justify-between items-center mb-6">
<span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">Model Bias Risk</span>
<div className="bg-error/10 p-2 rounded-lg">
<span className="material-symbols-outlined text-error text-xl" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
</div>
</div>
<div className="flex items-baseline gap-3">
<span className="text-6xl font-bold mono-text text-on-surface">Low</span>
</div>
<p className="text-on-surface-variant text-sm mt-6 leading-relaxed font-medium">No significant disparate impact detected across primary protected attributes.</p>
</div>
<div className="bg-surface-container rounded-2xl p-8 soft-shadow border border-transparent hover:border-secondary/20 transition-all soft-shadow-hover">
<div className="flex justify-between items-center mb-6">
<span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">Audit Confidence</span>
<div className="bg-secondary/10 p-2 rounded-lg">
<span className="material-symbols-outlined text-secondary text-xl">insights</span>
</div>
</div>
<div className="flex items-baseline gap-3">
<span className="text-6xl font-bold mono-text text-on-surface">98%</span>
</div>
<div className="flex gap-1.5 mt-8 items-end h-8">
<div className="flex-1 bg-surface-container-high rounded-md h-[40%]"></div>
<div className="flex-1 bg-surface-container-high rounded-md h-[60%]"></div>
<div className="flex-1 bg-surface-container-high rounded-md h-[50%]"></div>
<div className="flex-1 bg-primary/40 rounded-md h-[90%]"></div>
<div className="flex-1 bg-primary rounded-md h-full"></div>
</div>
</div>
</section>
{/* Metrics Bento Grid */}
<div>
<h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-on-surface">
<div className="bg-[#d6baff]/10 p-2 rounded-xl">
<span className="material-symbols-outlined text-primary text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>analytics</span>
</div>
                    Primary Fairness Metrics
                </h3>
<div className="grid grid-cols-1 md:grid-cols-12 gap-8">
{/* Large Metric Card: Demographic Parity */}
<div className="md:col-span-8 bg-surface-container rounded-2xl p-10 flex flex-col justify-between min-h-[450px] soft-shadow hover:bg-surface-container-high transition-colors group">
<div className="flex justify-between items-start">
<div className="space-y-4">
<h4 className="text-3xl font-black tracking-tight text-on-surface">Demographic Parity</h4>
<p className="text-on-surface-variant text-base max-w-md leading-relaxed">Ensures that the probability of a positive outcome is equal across all demographic groups in the dataset.</p>
</div>
<div className="flex flex-col items-end gap-6">
<div className="flex items-center gap-3 bg-tertiary/10 text-tertiary px-5 py-2 rounded-full text-xs font-black border border-tertiary/30 shadow-lg shadow-tertiary/10 uppercase tracking-widest">
<span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
                                    Optimal
                                </div>
<span className="text-6xl font-black mono-text text-on-surface group-hover:text-primary transition-colors">0.89</span>
</div>
</div>
<div className="mt-12 w-full h-56 bg-surface-container-low rounded-2xl p-8 flex items-end justify-between gap-6 border border-white/5">
{/* Mini Bar Chart */}
<div className="flex flex-col items-center gap-3 w-full group/bar">
<div className="w-full bg-primary/20 rounded-t-xl h-24 group-hover/bar:bg-primary/40 transition-all"></div>
<span className="text-xs font-mono font-bold text-neutral-500">Group A</span>
</div>
<div className="flex flex-col items-center gap-3 w-full group/bar">
<div className="w-full bg-primary/20 rounded-t-xl h-32 group-hover/bar:bg-primary/40 transition-all"></div>
<span className="text-xs font-mono font-bold text-neutral-500">Group B</span>
</div>
<div className="flex flex-col items-center gap-3 w-full group/bar">
<div className="w-full bg-primary rounded-t-xl h-44 shadow-lg shadow-primary/20"></div>
<span className="text-xs font-mono font-bold text-primary">Group C</span>
</div>
<div className="flex flex-col items-center gap-3 w-full group/bar">
<div className="w-full bg-primary/20 rounded-t-xl h-28 group-hover/bar:bg-primary/40 transition-all"></div>
<span className="text-xs font-mono font-bold text-neutral-500">Group D</span>
</div>
<div className="flex flex-col items-center gap-3 w-full group/bar">
<div className="w-full bg-primary/20 rounded-t-xl h-16 group-hover/bar:bg-primary/40 transition-all"></div>
<span className="text-xs font-mono font-bold text-neutral-500">Group E</span>
</div>
</div>
</div>
{/* Side Stats */}
<div className="md:col-span-4 flex flex-col gap-8">
<div className="bg-surface-container rounded-2xl p-8 flex flex-col justify-between h-full soft-shadow hover:bg-surface-container-high transition-all group/side border border-transparent hover:border-error/20">
<div className="flex justify-between items-center mb-8">
<span className="font-black text-sm uppercase tracking-widest text-on-surface-variant">Equalized Odds</span>
<div className="w-3 h-3 rounded-full bg-error shadow-lg shadow-error/40"></div>
</div>
<div className="flex items-end justify-between mb-6">
<div className="text-5xl font-black mono-text text-on-surface">0.64</div>
<div className="w-24 h-14 flex items-end gap-1.5">
<div className="w-2 h-[30%] bg-error/20 rounded-t-sm"></div>
<div className="w-2 h-[50%] bg-error/20 rounded-t-sm"></div>
<div className="w-2 h-[20%] bg-error/40 rounded-t-sm"></div>
<div className="w-2 h-[80%] bg-error/60 rounded-t-sm"></div>
<div className="w-2 h-[40%] bg-error/20 rounded-t-sm"></div>
</div>
</div>
<div className="pt-6 border-t border-white/5">
<span className="text-xs text-error font-black uppercase tracking-widest bg-error/10 px-3 py-1.5 rounded-lg border border-error/20">Needs Mitigation</span>
</div>
</div>
<div className="bg-surface-container rounded-2xl p-8 flex flex-col justify-between h-full soft-shadow hover:bg-surface-container-high transition-all group/side border border-transparent hover:border-secondary/20">
<div className="flex justify-between items-center mb-8">
<span className="font-black text-sm uppercase tracking-widest text-on-surface-variant">Disparate Impact</span>
<div className="w-3 h-3 rounded-full bg-secondary shadow-lg shadow-secondary/40"></div>
</div>
<div className="flex items-end justify-between mb-6">
<div className="text-5xl font-black mono-text text-on-surface">0.82</div>
<div className="w-24 h-14 flex items-end gap-1.5">
<div className="w-2 h-[60%] bg-secondary/20 rounded-t-sm"></div>
<div className="w-2 h-[40%] bg-secondary/40 rounded-t-sm"></div>
<div className="w-2 h-[90%] bg-secondary/60 rounded-t-sm"></div>
<div className="w-2 h-[50%] bg-secondary/20 rounded-t-sm"></div>
<div className="w-2 h-[70%] bg-secondary/40 rounded-t-sm"></div>
</div>
</div>
<div className="pt-6 border-t border-white/5">
<span className="text-xs text-secondary font-black uppercase tracking-widest bg-secondary/10 px-3 py-1.5 rounded-lg border border-secondary/20">Within Tolerance</span>
</div>
</div>
</div>
{/* Three Bottom Small Metric Cards */}
<div className="md:col-span-4 bg-surface-container rounded-2xl p-8 soft-shadow border border-transparent hover:border-tertiary/20 transition-all">
<div className="flex items-center justify-between mb-6">
<span className="text-xs uppercase tracking-widest text-on-surface-variant font-black">Predictive Equality</span>
<div className="w-3 h-3 rounded-full bg-tertiary shadow-lg shadow-tertiary/40"></div>
</div>
<div className="flex items-center justify-between mb-8">
<span className="text-4xl font-black mono-text text-on-surface">0.91</span>
<span className="text-xs font-mono font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-md">+0.02</span>
</div>
<div className="flex gap-1 items-end h-12">
<div className="flex-1 bg-surface-container-high h-[40%] rounded-md"></div>
<div className="flex-1 bg-surface-container-high h-[60%] rounded-md"></div>
<div className="flex-1 bg-tertiary/40 h-[90%] rounded-md"></div>
<div className="flex-1 bg-tertiary h-[100%] rounded-md"></div>
</div>
</div>
<div className="md:col-span-4 bg-surface-container rounded-2xl p-8 soft-shadow border border-transparent hover:border-error/20 transition-all">
<div className="flex items-center justify-between mb-6">
<span className="text-xs uppercase tracking-widest text-on-surface-variant font-black">Equal Opportunity</span>
<div className="w-3 h-3 rounded-full bg-error shadow-lg shadow-error/40"></div>
</div>
<div className="flex items-center justify-between mb-8">
<span className="text-4xl font-black mono-text text-on-surface">0.58</span>
<span className="text-xs font-mono font-bold text-error bg-error/10 px-2 py-1 rounded-md">-0.12</span>
</div>
<div className="flex gap-1 items-end h-12">
<div className="flex-1 bg-error h-[100%] rounded-md"></div>
<div className="flex-1 bg-error/40 h-[80%] rounded-md"></div>
<div className="flex-1 bg-surface-container-high h-[50%] rounded-md"></div>
<div className="flex-1 bg-surface-container-high h-[30%] rounded-md"></div>
</div>
</div>
<div className="md:col-span-4 bg-surface-container rounded-2xl p-8 soft-shadow border border-transparent hover:border-tertiary/20 transition-all">
<div className="flex items-center justify-between mb-6">
<span className="text-xs uppercase tracking-widest text-on-surface-variant font-black">Treatment Equality</span>
<div className="w-3 h-3 rounded-full bg-tertiary shadow-lg shadow-tertiary/40"></div>
</div>
<div className="flex items-center justify-between mb-8">
<span className="text-4xl font-black mono-text text-on-surface">0.95</span>
<span className="text-[10px] font-mono font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-md tracking-wider">STABLE</span>
</div>
<div className="flex gap-1 items-end h-12">
<div className="flex-1 bg-tertiary h-[95%] rounded-md"></div>
<div className="flex-1 bg-tertiary h-[95%] rounded-md"></div>
<div className="flex-1 bg-tertiary h-[95%] rounded-md"></div>
<div className="flex-1 bg-tertiary h-[95%] rounded-md"></div>
</div>
</div>
</div>
</div>
{/* Footer / Export Actions */}
<div className="flex justify-between items-center bg-surface-container-low p-8 rounded-2xl border border-white/5 soft-shadow mt-12">
<div className="flex items-center gap-4">
<div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center border border-white/10">
<span className="material-symbols-outlined text-primary">data_object</span>
</div>
<div>
<h5 className="font-bold text-on-surface text-lg">Data Snapshot: v2.4.0-final</h5>
<p className="text-sm text-on-surface-variant">Last audited 2 hours ago by <span className="text-primary font-semibold">System Admin</span></p>
</div>
</div>
<div className="flex gap-4">
<button className="px-8 py-3 rounded-xl bg-surface-container-highest text-on-surface font-bold text-sm hover:bg-surface-bright transition-all active:scale-95 border border-white/10">
                        Download JSON
                    </button>
<button className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#6b2fbf] to-[#d6baff] text-white font-black text-sm shadow-xl shadow-purple-900/20 hover:brightness-110 transition-all active:scale-95 flex items-center gap-2">
<span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                        Generate PDF Report
                    </button>
</div>
</div>
</div>
    </div>
  );
};

export default ResultsPage;

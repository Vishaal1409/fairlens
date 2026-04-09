const ExplainabilityPage = () => {
  return (
    <div className="pt-8 px-0 pb-12 w-full max-w-[1400px]">
      {/* Content Canvas */}
<div className="pt-24 px-12 pb-12 space-y-8 max-w-[1400px]">
{/* Bento Header Grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
<div className="md:col-span-2 p-10 rounded-2xl bg-surface-container-low flex flex-col justify-between overflow-hidden relative group border border-outline-variant/10 shadow-xl">
<div className="relative z-10">
<h2 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Model Interpretability</h2>
<p className="text-on-surface-variant max-w-lg leading-relaxed text-lg font-light">
                            Analyzing the influence of feature sets on model outcomes using SHAP values. Identify which parameters are driving bias or predictive accuracy.
                        </p>
</div>
<div className="mt-10 flex gap-6 relative z-10">
<div className="px-5 py-3 bg-surface-container/50 backdrop-blur rounded-xl border border-outline-variant/20 shadow-inner">
<span className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">Global Consistency</span>
<span className="data-mono text-2xl text-primary font-bold">94.2%</span>
</div>
<div className="px-5 py-3 bg-surface-container/50 backdrop-blur rounded-xl border border-outline-variant/20 shadow-inner">
<span className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">Bias Drift</span>
<span className="data-mono text-2xl text-tertiary font-bold">-2.1%</span>
</div>
</div>
<div className="absolute top-0 right-0 w-2/5 h-full opacity-10 group-hover:opacity-25 transition-all duration-700">
<img className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" data-alt="Abstract 3D digital visualization of interconnected data nodes and light paths on a dark background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLP-DW2C_rnl8Y4JJACjLuCoiD8XChXToNt_FQneV9kUqebQYJoe_ceITbe__EaNOXFZEE4vIonuXvtUXA06bx4yFWlNdZUTliKPm2mXcmH62VX2TvChch6HG14HdRdvxMxWQ5F6KvOtrnkUMfefOnmEiqNn3Sj7eg7p9myZkInxVLtZFmSdeKjQTFmVQtEEoIcul5DVk7IxrUaJwWWaoDsWIsAiwBel4se4ih-Uor92JuBaXlqGNfB7w2-hjs-rThquUYDrsSZKrS"/>
</div>
</div>
<div className="glass-panel p-10 rounded-2xl border border-outline-variant/20 flex flex-col justify-center shadow-xl ring-1 ring-white/5">
<div className="flex items-center gap-3 mb-6">
<div className="p-3 bg-primary/20 rounded-xl">
<span className="material-symbols-outlined text-primary text-2xl" data-icon="lightbulb">lightbulb</span>
</div>
<h3 className="font-bold text-xl tracking-tight text-white">AI Insight</h3>
</div>
<p className="text-base text-on-surface-variant italic leading-relaxed font-light">
                        "The model relies heavily on <span className="text-primary font-semibold">Zip Code</span> which may be acting as a proxy for socioeconomic status. Consider auditing geographic weightings."
                    </p>
</div>
</div>
{/* Main Analysis View (Asymmetric) */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
{/* Feature Importance Chart (SHAP Style) */}
<div className="lg:col-span-8 bg-surface-container rounded-2xl p-10 border border-outline-variant/10 shadow-2xl relative overflow-hidden">
<div className="flex items-center justify-between mb-12 relative z-10">
<div>
<h3 className="text-2xl font-black tracking-tight text-white mb-2">Feature Contribution</h3>
<p className="text-sm text-neutral-500 font-mono tracking-tighter uppercase">Mean |SHAP Value| <span className="mx-2">/</span> Average Impact</p>
</div>
<div className="flex bg-surface-container-high p-1 rounded-lg">
<button className="px-4 py-2 text-xs font-bold rounded-md text-neutral-400 hover:text-white transition-all">LOCAL</button>
<button className="px-4 py-2 text-xs font-bold bg-primary text-on-primary rounded-md shadow-lg shadow-primary/20">GLOBAL</button>
</div>
</div>
<div className="space-y-8 relative z-10 chart-grid-line pb-4">
{/* Bar Item */}
<div className="grid grid-cols-[160px_1fr_60px] items-center gap-6 group">
<span className="data-mono text-[11px] uppercase tracking-widest text-neutral-400 font-semibold group-hover:text-white transition-colors">Annual Income</span>
<div className="h-10 w-full bg-surface-container-high/50 rounded-lg overflow-hidden flex relative ring-1 ring-white/5">
<div className="h-full bg-gradient-to-r from-primary-container/80 to-primary shadow-[0_0_20px_rgba(214,186,255,0.3)]" style={{width: "85%"}}></div>
</div>
<span className="data-mono text-primary font-bold text-sm text-right">+0.42</span>
</div>
{/* Bar Item */}
<div className="grid grid-cols-[160px_1fr_60px] items-center gap-6 group">
<span className="data-mono text-[11px] uppercase tracking-widest text-neutral-400 font-semibold group-hover:text-white transition-colors">Credit Score</span>
<div className="h-10 w-full bg-surface-container-high/50 rounded-lg overflow-hidden flex relative ring-1 ring-white/5">
<div className="h-full bg-gradient-to-r from-primary-container/80 to-primary shadow-[0_0_20px_rgba(214,186,255,0.2)]" style={{width: "78%"}}></div>
</div>
<span className="data-mono text-primary font-bold text-sm text-right">+0.38</span>
</div>
{/* Bar Item */}
<div className="grid grid-cols-[160px_1fr_60px] items-center gap-6 group">
<span className="data-mono text-[11px] uppercase tracking-widest text-neutral-400 font-semibold group-hover:text-white transition-colors">Age Range</span>
<div className="h-10 w-full bg-surface-container-high/50 rounded-lg overflow-hidden flex relative ring-1 ring-white/5">
<div className="h-full bg-gradient-to-r from-secondary-container/80 to-secondary shadow-[0_0_20px_rgba(192,193,255,0.2)]" style={{width: "45%"}}></div>
</div>
<span className="data-mono text-secondary font-bold text-sm text-right">+0.22</span>
</div>
{/* Bar Item */}
<div className="grid grid-cols-[160px_1fr_60px] items-center gap-6 group">
<span className="data-mono text-[11px] uppercase tracking-widest text-neutral-400 font-semibold group-hover:text-white transition-colors">Zip Code</span>
<div className="h-10 w-full bg-surface-container-high/50 rounded-lg overflow-hidden flex relative ring-1 ring-white/5">
<div className="h-full bg-gradient-to-r from-error/60 to-error shadow-[0_0_20px_rgba(255,180,171,0.2)]" style={{width: "35%"}}></div>
</div>
<span className="data-mono text-error font-bold text-sm text-right">-0.18</span>
</div>
{/* Bar Item */}
<div className="grid grid-cols-[160px_1fr_60px] items-center gap-6 group">
<span className="data-mono text-[11px] uppercase tracking-widest text-neutral-400 font-semibold group-hover:text-white transition-colors">Employment History</span>
<div className="h-10 w-full bg-surface-container-high/50 rounded-lg overflow-hidden flex relative ring-1 ring-white/5">
<div className="h-full bg-surface-bright/50" style={{width: "22%"}}></div>
</div>
<span className="data-mono text-neutral-400 font-bold text-sm text-right">+0.11</span>
</div>
</div>
<div className="mt-12 pt-10 border-t border-outline-variant/10 flex justify-between items-center relative z-10">
<div className="flex items-center gap-8">
<div className="flex items-center gap-2">
<span className="w-4 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(214,186,255,0.4)]"></span>
<span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Positive Influence</span>
</div>
<div className="flex items-center gap-2">
<span className="w-4 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.4)]"></span>
<span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">Negative Influence</span>
</div>
</div>
<button className="bg-[#d6baff]/10 text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2 group">
                            EXPORT SHAP CSV 
                            <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform" data-icon="download">download</span>
</button>
</div>
</div>
{/* Text-based Explanation Panel */}
<div className="lg:col-span-4 space-y-8">
<div className="bg-surface-container-low rounded-2xl p-8 border border-outline-variant/10 shadow-xl">
<h4 className="font-black text-xs uppercase tracking-[0.25em] text-primary mb-8 border-b border-primary/20 pb-4">In-Depth Analysis</h4>
<div className="space-y-10">
<div>
<h5 className="text-base font-bold mb-3 text-white">High Proxy Risk: Zip Code</h5>
<p className="text-sm text-on-surface-variant leading-relaxed font-light">
                                    The model identifies <span className="text-white font-bold bg-white/5 px-1.5 py-0.5 rounded">Zip Code</span> as a top 4 feature. Statistical correlation tests suggest an <span className="text-error font-medium">82% overlap</span> with protected racial demographics.
                                </p>
</div>
<div>
<h5 className="text-base font-bold mb-3 text-white">Non-Linear Relationship: Age</h5>
<p className="text-sm text-on-surface-variant leading-relaxed font-light">
                                    The importance of <span className="text-white font-bold bg-white/5 px-1.5 py-0.5 rounded">Age</span> increases exponentially above the 55+ threshold, potentially introducing ageism in risk assessment.
                                </p>
</div>
<div className="p-6 bg-tertiary-container/10 border border-tertiary-container/30 rounded-2xl ring-1 ring-tertiary/10">
<div className="flex items-center gap-3 mb-3">
<span className="material-symbols-outlined text-tertiary text-xl" data-icon="verified" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
<span className="text-xs font-black text-tertiary uppercase tracking-widest">Recommendation</span>
</div>
<p className="text-xs text-tertiary-fixed-dim leading-relaxed font-medium">
                                    Replace Zip Code with generalized 'Distance to Hub' to maintain predictive power while decoupling from sensitive geographic bias.
                                </p>
</div>
</div>
</div>
<div className="bg-surface-container rounded-2xl p-8 border border-outline-variant/5 shadow-lg">
<h4 className="font-bold text-xs uppercase tracking-[0.2em] text-neutral-500 mb-6">Audit Logs</h4>
<ul className="space-y-6">
<li className="flex items-start gap-4">
<div className="mt-1 p-2 bg-neutral-800 rounded-lg">
<span className="material-symbols-outlined text-neutral-400 text-lg" data-icon="history">history</span>
</div>
<div>
<p className="text-sm text-neutral-200 font-medium">Re-ran permutation importance</p>
<p className="text-[10px] text-neutral-500 uppercase tracking-tighter mt-0.5">2 hours ago • Automated Task</p>
</div>
</li>
<li className="flex items-start gap-4">
<div className="mt-1 p-2 bg-neutral-800 rounded-lg">
<span className="material-symbols-outlined text-neutral-400 text-lg" data-icon="edit_note">edit_note</span>
</div>
<div>
<p className="text-sm text-neutral-200 font-medium">Mitigation strategy applied</p>
<p className="text-[10px] text-neutral-500 uppercase tracking-tighter mt-0.5">Yesterday • User: sarah_dev</p>
</div>
</li>
</ul>
</div>
</div>
</div>
</div>
    </div>
  );
};

export default ExplainabilityPage;

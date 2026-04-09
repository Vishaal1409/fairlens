const MitigationPage = () => {
  return (
    <div className="pt-8 px-12 pb-12 max-w-[1600px] mx-auto">
      {/* Header Section */}
<header className="mb-16">
<div className="flex items-center gap-4 mb-4">
<div className="h-px flex-1 bg-white/5"></div>
<span className="text-[10px] font-mono text-primary/60 tracking-[0.4em] uppercase">Control Center</span>
<div className="h-px flex-1 bg-white/5"></div>
</div>
<h1 className="text-5xl font-extrabold tracking-tight mb-4">Bias Mitigation</h1>
<p className="text-on-surface-variant max-w-3xl text-lg leading-relaxed opacity-80">
                Calibrate model parameters to neutralize systematic disparities. Preview the operational trade-off between strict fairness and performance benchmarks in a simulated environment.
            </p>
</header>
{/* Main Comparison Bento Grid */}
<div className="grid grid-cols-12 gap-10">
{/* Comparison Controls Sidebar */}
<div className="col-span-4 space-y-8">
<div className="p-10 rounded-3xl bg-surface-container-low border border-white/5 card-shadow">
<h3 className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-8">Adjustment Strategy</h3>
<div className="space-y-4">
<label className="block group cursor-pointer">
<input defaultChecked className="sr-only peer" name="strategy" type="radio"/>
<div className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 peer-checked:border-primary/50 peer-checked:bg-primary/5 transition-all duration-300">
<div className="flex items-center justify-between mb-2">
<span className="font-bold text-base group-hover:text-primary transition-colors">Disparity Equalization</span>
<div className="w-4 h-4 rounded-full border-2 border-outline-variant peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
<div className="w-1.5 h-1.5 rounded-full bg-white hidden peer-checked:block"></div>
</div>
</div>
<p className="text-sm text-on-surface-variant leading-relaxed opacity-70">Strictly minimizes scoring gaps between protected and reference demographics.</p>
</div>
</label>
<label className="block group cursor-pointer">
<input className="sr-only peer" name="strategy" type="radio"/>
<div className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 peer-checked:border-primary/50 peer-checked:bg-primary/5 transition-all duration-300">
<div className="flex items-center justify-between">
<span className="font-bold text-base group-hover:text-primary transition-colors">Target Calibration</span>
<div className="w-4 h-4 rounded-full border-2 border-outline-variant"></div>
</div>
</div>
</label>
</div>
<div className="mt-12">
<div className="flex justify-between items-center mb-6">
<span className="text-sm font-semibold tracking-wide">Aggression Level</span>
<span className="mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">0.65</span>
</div>
<div className="relative h-1.5 w-full bg-surface-container-highest rounded-full">
<div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{width: "65%"}}></div>
<div className="absolute top-1/2 -translate-y-1/2 left-[65%] w-4 h-4 bg-white rounded-full shadow-lg border-4 border-primary cursor-pointer"></div>
</div>
</div>
<button className="w-full mt-12 py-5 premium-btn rounded-2xl font-bold text-on-primary-container text-lg tracking-wide active:scale-[0.97]">
                        Apply Mitigation Fix
                    </button>
</div>
<div className="p-8 rounded-3xl bg-surface-container-low border border-white/5 card-shadow">
<h4 className="text-xs font-mono text-on-surface-variant uppercase tracking-widest mb-6 opacity-60">Affected Groups</h4>
<div className="space-y-4">
<div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
<span className="text-sm font-medium">Age (Under 25)</span>
<span className="px-3 py-1 rounded-full bg-error-container/20 text-error text-[10px] font-extrabold border border-error/20">CRITICAL</span>
</div>
<div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
<span className="text-sm font-medium">Region (Zone B)</span>
<span className="px-3 py-1 rounded-full bg-tertiary-container/20 text-tertiary text-[10px] font-extrabold border border-tertiary/20">STABLE</span>
</div>
</div>
</div>
</div>
{/* Before vs After View */}
<div className="col-span-8 space-y-10">
<div className="grid grid-cols-2 gap-10">
{/* Before Card */}
<div className="rounded-3xl bg-surface-container-low border border-white/5 overflow-hidden flex flex-col card-shadow relative">
<div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-lowest/50">
<span className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant opacity-60">Status: Current Baseline</span>
<span className="mono text-[10px] px-2 py-0.5 bg-error/10 text-error rounded border border-error/20">v1.0.4</span>
</div>
<div className="p-10 flex-1">
<div className="mb-12">
<p className="text-[10px] text-on-surface-variant font-mono mb-3 tracking-widest">OVERALL BIAS SCORE</p>
<div className="flex items-baseline gap-2">
<span className="text-7xl font-extrabold mono text-error tracking-tighter">24.2</span>
<span className="text-2xl font-bold text-error/60">%</span>
</div>
</div>
<div className="space-y-8">
<div>
<div className="flex justify-between mb-3">
<span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">FPR Variance</span>
<span className="mono text-sm text-on-surface/80">0.18</span>
</div>
<div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-error w-[75%] h-full opacity-80"></div>
</div>
</div>
<div>
<div className="flex justify-between mb-3">
<span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">Impact Ratio</span>
<span className="mono text-sm text-on-surface/80">0.72</span>
</div>
<div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-error w-[60%] h-full opacity-80"></div>
</div>
</div>
</div>
</div>
</div>
{/* After Card */}
<div className="rounded-3xl bg-surface-container-low border border-primary/20 overflow-hidden flex flex-col relative card-shadow group">
<div className="absolute inset-0 bg-primary/5 pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
<div className="p-6 border-b border-primary/10 flex justify-between items-center bg-primary-container/10">
<span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary font-bold">Status: Projected Fix</span>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-sm" data-icon="trending_down">trending_down</span>
<span className="mono text-[10px] text-primary font-bold tracking-tighter bg-primary/20 px-2 py-0.5 rounded">SIMULATED</span>
</div>
</div>
<div className="p-10 flex-1 relative z-10">
<div className="mb-12">
<p className="text-[10px] text-on-surface-variant font-mono mb-3 tracking-widest">PROJECTED BIAS SCORE</p>
<div className="flex items-baseline gap-4">
<div className="flex items-baseline gap-2">
<span className="text-7xl font-extrabold mono text-tertiary tracking-tighter">12.1</span>
<span className="text-2xl font-bold text-tertiary/60">%</span>
</div>
<span className="text-tertiary text-xs font-bold bg-tertiary/10 border border-tertiary/20 px-3 py-1.5 rounded-full">-12.1% Reduction</span>
</div>
</div>
<div className="space-y-8">
<div>
<div className="flex justify-between mb-3">
<span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">FPR Variance</span>
<span className="mono text-sm text-tertiary">0.08</span>
</div>
<div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-tertiary w-[35%] h-full"></div>
</div>
</div>
<div>
<div className="flex justify-between mb-3">
<span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">Impact Ratio</span>
<span className="mono text-sm text-tertiary">0.89</span>
</div>
<div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-tertiary w-[89%] h-full"></div>
</div>
</div>
</div>
</div>
</div>
</div>
{/* Accuracy Trade-off Bento Item */}
<div className="p-10 rounded-3xl bg-surface-container border border-white/5 relative overflow-hidden card-shadow">
<div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[120px] -z-10"></div>
<div className="flex items-start justify-between mb-12">
<div>
<h3 className="text-2xl font-bold mb-2">Performance Benchmark Trade-off</h3>
<p className="text-on-surface-variant text-base opacity-70">Impact of fairness constraints on predictive reliability.</p>
</div>
<div className="flex gap-6 bg-surface-container-low p-3 rounded-2xl border border-white/5">
<div className="flex items-center gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-primary/40 border border-primary/20"></div>
<span className="text-xs font-medium opacity-60">Current</span>
</div>
<div className="flex items-center gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
<span className="text-xs font-medium opacity-60">Proposed</span>
</div>
</div>
</div>
<div className="flex items-end gap-16 h-48">
<div className="flex-1 space-y-4">
<div className="flex justify-between items-end pb-4 border-b border-white/5">
<div className="space-y-1">
<p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">Model Accuracy</p>
<div className="flex items-center gap-3">
<span className="text-4xl font-extrabold mono tracking-tight">92.4%</span>
<div className="flex items-center text-error bg-error/10 px-2 py-0.5 rounded text-[10px] font-bold">
<span className="material-symbols-outlined text-xs mr-1" data-icon="arrow_downward">arrow_downward</span>
                                            1.2%
                                        </div>
</div>
</div>
<div className="flex items-end gap-3 h-24">
<div className="w-12 bg-primary/10 rounded-t-lg h-full border-t border-x border-primary/20"></div>
<div className="w-12 bg-tertiary/30 rounded-t-lg h-[92%] border-t-2 border-x border-tertiary"></div>
</div>
</div>
</div>
<div className="flex-1 space-y-4">
<div className="flex justify-between items-end pb-4 border-b border-white/5">
<div className="space-y-1">
<p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">Model Precision</p>
<div className="flex items-center gap-3">
<span className="text-4xl font-extrabold mono tracking-tight">88.7%</span>
<div className="flex items-center text-tertiary bg-tertiary/10 px-2 py-0.5 rounded text-[10px] font-bold">
<span className="material-symbols-outlined text-xs mr-1" data-icon="arrow_upward">arrow_upward</span>
                                            0.4%
                                        </div>
</div>
</div>
<div className="flex items-end gap-3 h-24">
<div className="w-12 bg-primary/10 rounded-t-lg h-[98%] border-t border-x border-primary/20"></div>
<div className="w-12 bg-tertiary/30 rounded-t-lg h-full border-t-2 border-x border-tertiary"></div>
</div>
</div>
</div>
</div>
<div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-6">
<span className="material-symbols-outlined text-primary text-3xl" data-icon="info">info</span>
<div>
<p className="text-sm font-semibold mb-1">Expert Recommendation</p>
<p className="text-sm text-on-surface-variant leading-relaxed opacity-80">
                                The marginal accuracy dip (1.2%) is statistically outweighed by the significant bias reduction (12.1%). <span className="text-primary font-bold">System deployment is highly recommended.</span>
</p>
</div>
</div>
</div>
{/* Sub-details Grid */}
<div className="grid grid-cols-12 gap-10">
<div className="col-span-4 p-8 rounded-3xl bg-surface-container-low border border-white/5 card-shadow">
<div className="flex items-center gap-3 mb-6">
<span className="material-symbols-outlined text-primary" data-icon="history">history</span>
<span className="text-xs font-bold uppercase tracking-[0.15em] opacity-60">Mitigation Logs</span>
</div>
<p className="text-[11px] text-on-surface-variant mb-6 leading-relaxed">Last baseline update: <span className="text-on-surface font-semibold">14 days ago</span> by Alex R.</p>
<div className="h-16 w-full flex items-end gap-1.5 px-2">
<div className="flex-1 bg-surface-container-highest h-[40%] rounded-md hover:bg-primary/20 transition-colors"></div>
<div className="flex-1 bg-surface-container-highest h-[60%] rounded-md hover:bg-primary/20 transition-colors"></div>
<div className="flex-1 bg-surface-container-highest h-[30%] rounded-md hover:bg-primary/20 transition-colors"></div>
<div className="flex-1 bg-primary/40 h-[90%] rounded-md border-t border-primary/50 shadow-[0_0_15px_rgba(107,47,191,0.2)]"></div>
<div className="flex-1 bg-primary/20 h-[50%] rounded-md hover:bg-primary/40 transition-colors"></div>
<div className="flex-1 bg-surface-container-highest h-[20%] rounded-md hover:bg-primary/20 transition-colors"></div>
</div>
</div>
<div className="col-span-8 p-8 rounded-3xl bg-surface-container-low border border-white/5 card-shadow flex items-center justify-between">
<div className="space-y-3">
<span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest opacity-60">Active Model Architecture</span>
<h4 className="text-2xl font-bold">XGBoost Classifier v2.0</h4>
<p className="text-sm text-on-surface-variant">Adjusting weights for protected attribute: <span className="mono text-primary font-bold bg-primary/5 px-2 py-0.5 rounded">race_ethnicity</span></p>
</div>
<div className="flex flex-col items-end gap-4">
<div className="flex -space-x-3">
<div className="w-12 h-12 rounded-full border-4 border-surface-container-low overflow-hidden shadow-xl">
<img alt="Auditor 1" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsNDYcUqRNB-7GuNG4PMGk4josmCKX2JXtiocWoth4bAbdkBGc6VcHqsO1V-N-F1BCBdpspOEoGB-_LYZBgkBO78bXiZTCzRqcHnKlcx1qA7JewSgn2HqyD2ckg7wL06asXb7kZgtyrklLH8e6fAkV3TqTs5o_GS6i4IFwbwodyuAHXOObjz8hUCwUaMi4jAo_Fwzs-T2LtF7ICzcmzt9siKvabXYAZ6GIhnlGAkU6FQE1u6-wYfvNaZl44Sldk_hnHdykJpmNvMc0"/>
</div>
<div className="w-12 h-12 rounded-full border-4 border-surface-container-low overflow-hidden shadow-xl">
<img alt="Auditor 2" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuYFAYrVTCuXvuakZtfsBjDt4dzyydAF9NT7AwzugzTvGw_ZISXm_I31vvhA2mKHUf9FTBkZtT83NNJR95f8kQjNS6hQmITHCRhQ3NkA00Ks8SyOrOC773D3N_X-Xgj6pxqc8lewVJwR0KnqS22P5dBN0BLLNk90F72mwJv_29vxGJIHv_uvCw7UWVuGtcG9nT2h33YOVmXl9Ee8HjHvKwNRPZzvTx7Xgd6mrH9C8sXyY9nC_2hXX3GGlN90nOuRUIn_YaaLuqQyhb"/>
</div>
<div className="w-12 h-12 rounded-full bg-primary-container border-4 border-surface-container-low flex items-center justify-center text-xs font-bold text-on-primary-container shadow-xl">
                                    +3
                                </div>
</div>
<span className="text-[10px] text-on-surface-variant font-mono tracking-widest uppercase opacity-50">Auditor Stakeholders</span>
</div>
</div>
</div>
</div>
</div>
    </div>
  );
};

export default MitigationPage;

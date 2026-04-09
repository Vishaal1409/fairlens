const ConfigPanel = ({ onAnalyze }) => {
  return (
    <div className="bg-surface-container-high card-elevation rounded-[2rem] p-10 border border-outline-variant/20">
      <h4 className="text-2xl font-bold mb-10 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-3xl">tune</span>
        Configuration
      </h4>
      <div className="space-y-10">
        <div>
          <label className="block text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 mb-4">Model Type</label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-surface-container-lowest rounded-2xl">
            <button className="bg-primary/10 border border-primary/30 text-primary px-4 py-3 rounded-xl text-sm font-bold shadow-sm">Binary Class.</button>
            <button className="text-neutral-500 px-4 py-3 rounded-xl text-sm font-medium hover:text-on-surface transition-colors">Regression</button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 mb-4">Sensitive Attributes</label>
          <div className="flex flex-wrap gap-2.5">
            {["Gender", "Ethnicity"].map((attr) => (
              <div key={attr} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                {attr}
                <span className="material-symbols-outlined text-sm cursor-pointer">close</span>
              </div>
            ))}
            <button className="px-4 py-2 bg-surface-container-highest text-neutral-400 hover:text-on-surface rounded-full text-xs font-bold transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> Add New
            </button>
          </div>
        </div>
      </div>
      <div className="mt-14 space-y-6">
        <button
          onClick={onAnalyze}
          className="w-full py-5 bg-[#6b2fbf] hover:bg-[#7b3fd0] text-white rounded-2xl font-bold text-xl shadow-xl shadow-[#6b2fbf]/30 active:scale-[0.97] transition-all flex items-center justify-center gap-4 group"
        >
          Analyze Bias
          <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_awesome</span>
        </button>
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-[11px] text-neutral-500 uppercase tracking-widest font-medium">Estimated Time: 45 seconds</p>
          <div className="w-full bg-surface-container-lowest h-1 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-primary/20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;

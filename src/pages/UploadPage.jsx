import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';

const UploadPage = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelTask, setModelTask] = useState('Binary Class.');
  const [sensitiveAttrs, setSensitiveAttrs] = useState(['Gender', 'Race']);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    // Simulated delay for UX "Polish" before navigating
    setTimeout(() => navigate('/results'), 1800);
  };

  const removeAttr = (attrToRemove) => {
    setSensitiveAttrs(sensitiveAttrs.filter(attr => attr !== attrToRemove));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">Upload Dataset</h1>
        <p className="text-[#888780] text-lg max-w-2xl font-light leading-relaxed">
          Bring your model data into FairLens to begin your automated audit for algorithmic bias and ethical risks.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Upload Zone */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="drop-zone-border bg-[#1b1c1d]/40 card-elevation min-h-[420px] flex flex-col items-center justify-center p-12 transition-all hover:bg-[#1f2021] group relative overflow-hidden border border-white/5">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#6b2fbf]/10 blur-[80px] rounded-full group-hover:bg-[#6b2fbf]/15 transition-colors"></div>
            
            {/* Integration of Shruthika's Uploader */}
            <div className="relative z-10 w-full flex flex-col items-center">
              {/* The FileUploader component renders its own icon, so we removed the duplicate one here */}
              <FileUploader />
            </div>
          </div>

          {/* Privacy/Security Badge */}
          <div className="bg-[#1b1c1d] rounded-2xl p-6 border border-white/5 flex items-start gap-4">
            <div className="p-3 bg-[#4edea3]/10 rounded-xl">
              <span className="material-symbols-outlined text-[#4edea3] text-2xl">verified_user</span>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Privacy-First Auditing</h4>
              <p className="text-xs text-[#888780] mt-1">Data is processed in-memory and purged immediately after analysis. No permanent storage used.</p>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-[#1b1c1d] rounded-3xl p-8 border border-white/5 card-elevation">
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6b2fbf] text-xl">settings_input_component</span>
              Audit Config
            </h3>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#888780] block mb-3">Model Task</label>
                <div className="flex p-1 bg-[#121315] rounded-xl gap-1">
                  <button 
                    onClick={() => setModelTask('Binary Class.')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors ${modelTask === 'Binary Class.' ? 'bg-[#6b2fbf] text-white' : 'bg-transparent text-[#888780] hover:text-white'}`}
                  >
                    Binary Class.
                  </button>
                  <button 
                    onClick={() => setModelTask('Regression')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors ${modelTask === 'Regression' ? 'bg-[#6b2fbf] text-white' : 'bg-transparent text-[#888780] hover:text-white'}`}
                  >
                    Regression
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#888780] block mb-3">Sensitive Attributes</label>
                <div className="flex flex-wrap gap-2">
                  {sensitiveAttrs.map(attr => (
                    <button key={attr} onClick={() => removeAttr(attr)} className="px-3 py-1.5 bg-[#6b2fbf]/20 hover:bg-[#6b2fbf]/30 transition-colors border border-[#6b2fbf]/30 rounded-full text-[11px] font-bold text-[#d6baff] flex items-center gap-1">
                      {attr} <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  ))}
                  {sensitiveAttrs.length === 0 && <span className="text-xs text-[#888780]">No attributes selected</span>}
                </div>
              </div>
            </div>

            <button 
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="w-full mt-12 py-4 bg-[#6b2fbf] hover:bg-[#7c3aed] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#6b2fbf]/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isAnalyzing ? "Processing Dataset..." : "Analyze Bias"}
              {!isAnalyzing && <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
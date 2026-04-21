import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import HeroSection from '../components/HeroSection';
import Reveal from '../components/ui/Reveal';
import MagneticButton from '../components/ui/MagneticButton';

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
    <div>
      <HeroSection
        eyebrow="FAIRNESS • EXPLAINABILITY • MITIGATION"
        subtitle="FairLens is a high-precision AI fairness audit cockpit. Upload a dataset, inspect bias metrics, and watch mitigation shift your fairness gap in real time."
        rightSlot={
          <div className="space-y-4">
            <Reveal className="rounded-2xl glass glass-stroke glass-card p-5" delay={0.15}>
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-muted mb-2">
                Quick start
              </p>
              <p className="text-[13px] text-p leading-relaxed">
                Drop a CSV to generate the Bento dashboard. You’ll see a scroll-toggled
                before→after mitigation story and color-glow feedback for every audit phase.
              </p>
              <div className="mt-4 flex gap-3">
                <MagneticButton onClick={() => navigate('/results')} className="w-full">
                  Preview Dashboard
                </MagneticButton>
              </div>
            </Reveal>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 pb-16">
        <Reveal delay={0.05} className="pt-10">
          <div className="grid grid-cols-12 gap-8">
        {/* Main Upload Zone */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="glass glass-stroke glass-card min-h-[420px] flex flex-col items-center justify-center p-12 transition-all group relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[rgba(34,211,238,0.10)] blur-[90px] rounded-full group-hover:bg-[rgba(34,211,238,0.14)] transition-colors"></div>
            
            {/* Integration of Shruthika's Uploader */}
            <div className="relative z-10 w-full flex flex-col items-center">
              {/* The FileUploader component renders its own icon, so we removed the duplicate one here */}
              <FileUploader />
            </div>
          </div>

          {/* Privacy/Security Badge */}
          <div className="glass glass-stroke glass-card rounded-2xl p-6 flex items-start gap-4">
            <div className="p-3 rounded-xl border border-white/10 bg-white/5">
              <span className="material-symbols-outlined text-white text-2xl">verified_user</span>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Privacy-First Auditing</h4>
              <p className="text-xs text-muted mt-1">Data is processed in-memory and purged immediately after analysis. No permanent storage used.</p>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="col-span-12 lg:col-span-4">
          <div className="glass glass-stroke glass-card rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-white text-xl">settings_input_component</span>
              Audit Config
            </h3>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.34em] text-muted block mb-3">Model Task</label>
                <div className="flex p-1 rounded-xl gap-1 bg-white/5 border border-white/10">
                  <button 
                    onClick={() => setModelTask('Binary Class.')}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-colors ${modelTask === 'Binary Class.' ? 'bg-white text-black' : 'bg-transparent text-white/70 hover:text-white'}`}
                  >
                    Binary Class.
                  </button>
                  <button 
                    onClick={() => setModelTask('Regression')}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-colors ${modelTask === 'Regression' ? 'bg-white text-black' : 'bg-transparent text-white/70 hover:text-white'}`}
                  >
                    Regression
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.34em] text-muted block mb-3">Sensitive Attributes</label>
                <div className="flex flex-wrap gap-2">
                  {sensitiveAttrs.map(attr => (
                    <button key={attr} onClick={() => removeAttr(attr)} className="px-3 py-1.5 bg-white/5 hover:bg-white/8 transition-colors border border-white/10 rounded-full text-[11px] font-bold text-white flex items-center gap-1">
                      {attr} <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  ))}
                  {sensitiveAttrs.length === 0 && <span className="text-xs text-muted">No attributes selected</span>}
                </div>
              </div>
            </div>

            <button 
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="w-full mt-12 py-4 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50
                         bg-white text-black hover:scale-[1.01]"
            >
              {isAnalyzing ? "Processing Dataset..." : "Analyze Bias"}
              {!isAnalyzing && <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </div>
        </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default UploadPage;
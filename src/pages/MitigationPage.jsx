import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const mitigationData = [
  { group: "Gender", before: 0.72, after: 0.41 },
  { group: "Race", before: 0.81, after: 0.38 },
  { group: "Age", before: 0.65, after: 0.29 },
  { group: "Zip Code", before: 0.58, after: 0.44 },
];

const MitigationPage = () => {
  const [isMitigating, setIsMitigating] = useState(false);
  const [algorithm, setAlgorithm] = useState('Reweighing');

  const handleApplyFix = () => {
    setIsMitigating(true);
    setTimeout(() => setIsMitigating(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-[#121315] min-h-screen p-8 text-[#e3e2e3]"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="text-[#6b2fbf]">🔧</span> Mitigation Control Center
        </h1>
        <p className="text-[#888780]">
          Apply state-of-the-art algorithms to reduce model bias.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Configuration */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-[#1b1c1d] rounded-2xl p-6 border border-white/5 hover:shadow-[0_0_24px_4px_rgba(139,92,246,0.25)] transition-shadow duration-300">
            <h2 className="text-xl font-semibold mb-6 text-white">Algorithm Selection</h2>
            
            <div className="mb-8">
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#888780] block mb-3">Choose Algorithm</label>
              <select 
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full bg-[#121315] text-[#e3e2e3] border border-white/5 rounded-xl p-3 outline-none focus:border-[#6b2fbf] transition-colors appearance-none"
              >
                <option value="Reweighing">Reweighing</option>
                <option value="Optimized Preprocessing">Optimized Preprocessing</option>
                <option value="Adversarial Debiasing">Adversarial Debiasing</option>
                <option value="Reject Option Classification">Reject Option Classification</option>
              </select>
            </div>

            <button
              onClick={handleApplyFix}
              disabled={isMitigating}
              className="w-full py-4 bg-[#6b2fbf] hover:bg-[#7c3aed] text-white rounded-xl font-bold text-sm shadow-xl shadow-[#6b2fbf]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isMitigating ? "Applying Fix..." : "Apply Fix"}
            </button>
          </div>
        </div>

        {/* Right Column: Chart Section */}
        <div className="col-span-12 lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-900 rounded-2xl p-6 border border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.08)] hover:shadow-[0_0_24px_4px_rgba(139,92,246,0.25)] transition-shadow duration-300"
          >
            <h3 className="text-lg font-medium text-white mb-4">Before vs. After Mitigation</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={mitigationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="group" tick={{ fill: '#94a3b8' }} />
                <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #7c3aed', borderRadius: '8px', color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', paddingTop: '16px' }} />
                <ReferenceLine y={0.5} stroke="#facc15" strokeDasharray="4 4" label={{ value: 'Fairness Threshold', fill: '#facc15', fontSize: 11 }} />
                <Bar dataKey="before" name="Before" fill="#f43f5e" />
                <Bar dataKey="after" name="After" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {mitigationData.map((d, i) => (
                <motion.div
                  key={d.group}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#121315] rounded-xl p-4 flex flex-col items-center justify-center border border-white/5"
                >
                  <span className="text-xs text-[#94a3b8] mb-2">{d.group}</span>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f43f5e]/20 text-[#f43f5e]">{d.before}</span>
                    <span className="material-symbols-outlined text-[10px] text-gray-500">arrow_forward</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#22c55e]/20 text-[#22c55e]">{d.after}</span>
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400">
                    Improvement: {((d.before - d.after) / d.before * 100).toFixed(1)}%
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MitigationPage;
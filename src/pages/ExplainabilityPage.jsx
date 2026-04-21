import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const shapData = [
  { feature: "Credit Score", shap: 0.43 },
  { feature: "Age", shap: -0.31 },
  { feature: "Income", shap: 0.27 },
  { feature: "Zip Code", shap: -0.22 },
  { feature: "Gender", shap: 0.18 },
  { feature: "Employment", shap: 0.14 },
];

const limeData = [
  { attribute: "Income", weight: 80 },
  { attribute: "Location", weight: 55 },
  { attribute: "Age", weight: 70 },
  { attribute: "History", weight: 45 },
  { attribute: "Gender", weight: 90 },
  { attribute: "Education", weight: 60 },
];

const ExplainabilityPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-[#121315] min-h-screen p-8 space-y-6 text-[#e3e2e3]"
    >
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          <span className="text-[#6b2fbf]">🔍</span> Explainability
        </h1>
        <p className="text-[#888780] mt-2">
          Understand model decisions using SHAP and LIME
        </p>
      </div>

      {/* SHAP Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-900 border border-violet-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(139,92,246,0.08)] hover:shadow-[0_0_24px_4px_rgba(139,92,246,0.25)] transition-shadow duration-300"
      >
        <h2 className="text-xl font-semibold mb-2 text-white">
          SHAP Feature Importance
        </h2>
        <p className="text-[#888780] mb-4 text-sm">
          Shows how each feature impacts predictions
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart layout="vertical" data={shapData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis type="number" domain={[-0.5, 0.5]} tick={{ fill: '#94a3b8' }} />
            <YAxis type="category" dataKey="feature" width={110} tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #7c3aed', borderRadius: '8px', color: '#e2e8f0' }} />
            <Bar dataKey="shap">
              {shapData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.shap > 0 ? '#8b5cf6' : '#f43f5e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* LIME Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-slate-900 border border-violet-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(139,92,246,0.08)] hover:shadow-[0_0_24px_4px_rgba(139,92,246,0.25)] transition-shadow duration-300"
      >
        <h2 className="text-xl font-semibold mb-2 text-white">
          LIME Local Explanations
        </h2>
        <p className="text-[#888780] mb-4 text-sm">
          Local explanation for individual predictions
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={limeData}>
            <PolarGrid stroke="#ffffff15" />
            <PolarAngleAxis dataKey="attribute" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #7c3aed', borderRadius: '8px', color: '#e2e8f0' }} />
            <Radar name="LIME Weight" dataKey="weight" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

    </motion.div>
  )
}

export default ExplainabilityPage
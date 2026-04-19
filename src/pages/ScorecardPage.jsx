const getColor = (score) => {
  if (score >= 0.7) return "bg-green-500/10 text-green-400 border-green-500/20"
  if (score >= 0.5) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
  return "bg-red-500/10 text-red-400 border-red-500/20"
}

const getLabel = (score) => {
  if (score >= 0.7) return "Fair"
  if (score >= 0.5) return "Moderate Bias"
  return "High Bias"
}

const dummyMetrics = {
  accuracy: 0.82,
  demographic_parity: 0.65,
  equal_opportunity: 0.48,
  disparate_impact: 0.71
}

const ScorecardPage = () => {
  return (
    <div className="p-8 bg-[#121315] min-h-screen text-[#e3e2e3]">

      <h1 className="text-3xl font-bold text-white mb-8">
        <span className="text-[#6b2fbf]">📋</span> Bias Scorecard
      </h1>

      <div className="grid gap-4 max-w-2xl">

        {Object.entries(dummyMetrics).map(([name, score]) => (
          <div
            key={name}
            className="flex justify-between items-center bg-[#1b1c1d] p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all shadow-xl shadow-black/20"
          >
            
            {/* Left */}
            <div>
              <p className="font-semibold text-lg capitalize text-white">
                {name.replace("_", " ")}
              </p>
              <p className="text-sm text-[#888780]">
                {getLabel(score)}
              </p>
            </div>

            {/* Right */}
            <div className="text-right">
              <p className="text-xl font-bold text-white mb-1">
                {score}
              </p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getColor(score)}`}>
                {getLabel(score)}
              </span>
            </div>

          </div>
        ))}

      </div>

    </div>
  )
}

export default ScorecardPage
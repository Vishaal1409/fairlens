const getColor = (score) => {
  if (score >= 0.7) return "bg-green-100 text-green-700"
  if (score >= 0.5) return "bg-yellow-100 text-yellow-700"
  return "bg-red-100 text-red-700"
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
    <div className="p-8 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold text-purple-700 mb-8">
        📋 Bias Scorecard
      </h1>

      <div className="grid gap-4 max-w-2xl">

        {Object.entries(dummyMetrics).map(([name, score]) => (
          <div
            key={name}
            className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition"
          >
            
            {/* Left */}
            <div>
              <p className="font-semibold text-lg capitalize">
                {name.replace("_", " ")}
              </p>
              <p className="text-sm text-gray-500">
                {getLabel(score)}
              </p>
            </div>

            {/* Right */}
            <div className="text-right">
              <p className="text-xl font-bold">
                {score}
              </p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColor(score)}`}>
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
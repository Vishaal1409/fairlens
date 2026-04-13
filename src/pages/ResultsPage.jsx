import SummaryBanner from "../components/SummaryBanner";

const dummyMetrics = {
  accuracy: 0.82,
  demographic_parity: 0.65,
  equal_opportunity: 0.48,
  disparate_impact: 0.71,
};

const ResultsPage = () => {
  return (
    <div className="ml-64 pt-20 px-8 bg-gray-900 min-h-screen text-white">

      {/* 🔥 SUMMARY BANNER */}
      <SummaryBanner metrics={dummyMetrics} />

      {/* 🔥 METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">

        {Object.entries(dummyMetrics).map(([name, score]) => (
          <div
            key={name}
            className="bg-gray-800 p-6 rounded-xl shadow hover:scale-105 transition"
          >
            <h3 className="text-sm text-gray-400 capitalize">{name}</h3>

            <p className="text-3xl font-bold mt-2">{score}</p>

            <div className="mt-3">
              {score >= 0.7 && (
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                  Fair
                </span>
              )}
              {score >= 0.5 && score < 0.7 && (
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                  Moderate Bias
                </span>
              )}
              {score < 0.5 && (
                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs">
                  High Bias
                </span>
              )}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default ResultsPage;
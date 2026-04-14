import { useLocation } from 'react-router-dom'
import BiasHeatmap from '../components/BiasHeatmap'
import SummaryBanner from '../components/SummaryBanner'

const dummyMetrics = {
    accuracy: 0.82,
    demographic_parity: 0.65,
    equal_opportunity: 0.48,
    disparate_impact: 0.71
}

const ResultsPage = () => {
    const location = useLocation()
    const metrics = location.state?.metrics ?? dummyMetrics

    return (
        <div className="min-h-screen bg-gray-50 p-8">

            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#2C2C2A" }}>
                    Results
                </h1>
                <p style={{ fontSize: "13px", color: "#888780", marginTop: "2px" }}>
                    AI fairness audit report
                </p>
            </div>

            <SummaryBanner metrics={metrics} />

            {/* Metric Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "10px",
                marginBottom: "1.5rem"
            }}>
                {Object.entries(metrics).map(([key, value]) => {
                    const status = value >= 0.7 ? "good" : value >= 0.5 ? "warning" : "danger"
                    return (
                        <div key={key} style={{
                            background: status === "good" ? "#EAFAF3" : status === "warning" ? "#FAEEDA" : "#FCEBEB",
                            border: `0.5px solid ${status === "good" ? "#1D9E75" : status === "warning" ? "#EF9F27" : "#E24B4A"}`,
                            borderRadius: "12px",
                            padding: "1rem 1.25rem"
                        }}>
                            <div style={{ fontSize: "11px", color: "#888780", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {key.replace(/_/g, " ")}
                            </div>
                            <div style={{ fontSize: "26px", fontWeight: 500, color: "#2C2C2A" }}>
                                {Math.round(value * 100)}%
                            </div>
                        </div>
                    )
                })}
            </div>

            <p style={{ fontSize: "11px", fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                Bias heatmap
            </p>

            <BiasHeatmap metrics={metrics} />

        </div>
    )
}

export default ResultsPage
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

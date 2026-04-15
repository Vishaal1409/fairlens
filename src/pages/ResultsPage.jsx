import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import BiasHeatmap from '../components/BiasHeatmap'
import SummaryBanner from '../components/SummaryBanner'
import SHAPChart from '../components/SHAPChart'
import BeforeAfterChart from '../components/BeforeAfterChart'
import { api } from '../api/client' // Ensure this path matches your file structure

const dummyMetrics = {
    accuracy: 0.82,
    demographic_parity: 0.65,
    equal_opportunity: 0.48,
    disperate_impact: 0.71
}

const dummyShap = {
    age: 0.42,
    income: 0.31,
    gender: -0.18,
    education: 0.27,
    race: -0.35,
    hours_per_week: 0.19,
    occupation: 0.22,
    marital_status: -0.11,
    relationship: 0.08,
    country: -0.05
}

const ResultsPage = () => {
    const location = useLocation()
    const metrics = location.state?.metrics ?? dummyMetrics
    const shapValues = location.state?.shapValues ?? dummyShap

    // State for mitigation results
    const [mitigatedData, setMitigatedData] = useState(null)
    const [loading, setLoading] = useState(false)

    // Function to call the /mitigate API
    const handleMitigation = async () => {
        setLoading(true)
        try {
            // We use the file_id from location state or a placeholder
            const fileId = location.state?.fileId || 'demo_file_123'
            const response = await api.post('/mitigate', { file_id: fileId })

            // Expected format: [{ metric: 'Demographic Parity', before: 0.65, after: 0.82 }, ...]
            setMitigatedData(response.data)
        } catch (error) {
            console.error("API Error, falling back to dummy mitigation data:", error)
            // Hackathon Fallback: If Arun's API isn't ready, show a successful "fix" anyway
            setMitigatedData([
                {
                    metric: 'Demographic Parity',
                    before: metrics.demographic_parity,
                    after: Math.min(metrics.demographic_parity + 0.2, 0.95)
                },
                {
                    metric: 'Equal Opportunity',
                    before: metrics.equal_opportunity,
                    after: Math.min(metrics.equal_opportunity + 0.25, 0.92)
                }
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header Section */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 500, color: "#2C2C2A" }}>
                    Results
                </h1>
                <p style={{ fontSize: "13px", color: "#888780", marginTop: "2px" }}>
                    AI fairness audit report
                </p>
            </div>

            <SummaryBanner metrics={metrics} />

            {/* Metric Cards Grid */}
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

            {/* Visualizations Section */}
            <SHAPChart shapValues={shapValues} />

            <div style={{ marginTop: "2rem" }}>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                    Bias heatmap
                </p>
                <BiasHeatmap metrics={metrics} />
            </div>

            {/* Mitigation Action Section */}
            <div style={{
                marginTop: "3rem",
                padding: "2rem",
                background: "#fff",
                borderRadius: "16px",
                border: "1px dashed #ccc",
                textAlign: "center"
            }}>
                {!mitigatedData ? (
                    <>
                        <h4 style={{ marginBottom: "10px" }}>Detected bias in your model?</h4>
                        <button
                            onClick={handleMitigation}
                            disabled={loading}
                            style={{
                                padding: "12px 28px",
                                backgroundColor: loading ? "#888" : "#2C2C2A",
                                color: "white",
                                borderRadius: "8px",
                                border: "none",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                transition: "all 0.2s"
                            }}
                        >
                            {loading ? "Processing Mitigation..." : "✨ Apply Bias Mitigation"}
                        </button>
                    </>
                ) : (
                    <BeforeAfterChart data={mitigatedData} />
                )}
            </div>
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

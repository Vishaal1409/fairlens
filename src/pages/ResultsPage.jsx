import { useLocation } from 'react-router-dom'
import BiasHeatmap from '../components/BiasHeatmap'
import SummaryBanner from '../components/SummaryBanner'
import SHAPChart from '../components/SHAPChart'

const dummyMetrics = {
    accuracy: 0.82,
    demographic_parity: 0.65,
    equal_opportunity: 0.48,
    disparate_impact: 0.71
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

            <SHAPChart shapValues={shapValues} />

            <p style={{ fontSize: "11px", fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                Bias heatmap
            </p>

            <BiasHeatmap metrics={metrics} />

        </div>
    )
}

export default ResultsPage
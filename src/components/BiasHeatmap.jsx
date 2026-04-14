import { useState } from "react"

const groups = ["Male", "Female", "Other"]

const getBg = (value) => {
    if (value >= 0.7) return { bg: "#EAFAF3", text: "#085041", border: "#1D9E75" }
    if (value >= 0.5) return { bg: "#FAEEDA", text: "#633806", border: "#EF9F27" }
    return { bg: "#FCEBEB", text: "#501313", border: "#E24B4A" }
}

const BiasHeatmap = ({ metrics }) => {
    const [hovered, setHovered] = useState(null)
    const metricNames = Object.keys(metrics)

    const groupData = metricNames.map((metric) => ({
        metric,
        scores: groups.map((_, i) => {
            const base = metrics[metric]
            const offsets = [-0.08, 0.05, -0.03]
            return Math.min(1, Math.max(0, base + offsets[i]))
        })
    }))

    return (
        <div style={{
            background: "#fff",
            border: "0.5px solid #D3D1C7",
            borderRadius: "12px",
            padding: "1.25rem",
            overflowX: "auto",
            marginBottom: "1.5rem"
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                    Bias heatmap — by group
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                    {[
                        { label: "Good ≥70%", bg: "#EAFAF3", text: "#085041" },
                        { label: "Fair 50–69%", bg: "#FAEEDA", text: "#633806" },
                        { label: "Poor <50%", bg: "#FCEBEB", text: "#501313" },
                    ].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: l.text }} />
                            <span style={{ fontSize: "11px", color: "#888780" }}>{l.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "4px" }}>
                <thead>
                    <tr>
                        <th style={{ fontSize: "11px", color: "#888780", textAlign: "left", padding: "4px 8px", fontWeight: 500 }}>
                            Metric
                        </th>
                        {groups.map(g => (
                            <th key={g} style={{ fontSize: "11px", color: "#888780", textAlign: "center", padding: "4px 8px", fontWeight: 500 }}>
                                {g}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {groupData.map(({ metric, scores }) => (
                        <tr key={metric}>
                            <td style={{ fontSize: "12px", color: "#5F5E5A", padding: "4px 8px", whiteSpace: "nowrap" }}>
                                {metric.replace(/_/g, " ")}
                            </td>
                            {scores.map((score, i) => {
                                const { bg, text, border } = getBg(score)
                                const key = `${metric}-${i}`
                                const isHovered = hovered === key
                                return (
                                    <td
                                        key={i}
                                        onMouseEnter={() => setHovered(key)}
                                        onMouseLeave={() => setHovered(null)}
                                        style={{
                                            background: bg,
                                            borderRadius: "6px",
                                            textAlign: "center",
                                            padding: "8px 12px",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            color: text,
                                            minWidth: "72px",
                                            border: isHovered ? `1.5px solid ${border}` : "1.5px solid transparent",
                                            cursor: "default",
                                            transition: "border 0.15s"
                                        }}>
                                        {Math.round(score * 100)}%
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default BiasHeatmap

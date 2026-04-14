const getStyles = (status) => {
  if (status === "good") return { dot: "#1D9E75", bg: "#EAFAF3", border: "#1D9E75", text: "#085041", sub: "#0F6E56" }
  if (status === "warning") return { dot: "#EF9F27", bg: "#FAEEDA", border: "#EF9F27", text: "#633806", sub: "#854F0B" }
  return { dot: "#E24B4A", bg: "#FCEBEB", border: "#E24B4A", text: "#501313", sub: "#A32D2D" }
}

const getStatus = (score) => {
  if (score >= 0.7) return "good"
  if (score >= 0.5) return "warning"
  return "danger"
}

export default function MetricCard({ name, score, status }) {
  const resolvedStatus = status ?? getStatus(score)
  const s = getStyles(resolvedStatus)
  const displayScore = typeof score === "number"
    ? `${Math.round(score * 100)}%`
    : score

  return (
    <div style={{
      background: s.bg,
      border: `0.5px solid ${s.border}`,
      borderRadius: "12px",
      padding: "1rem 1.25rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: s.sub, fontWeight: 500 }}>{name}</span>
      </div>
      <div style={{ fontSize: "28px", fontWeight: 500, color: s.text }}>
        {displayScore}
      </div>
export default function MetricCard({ name, score }) {
  let color = ""
  let label = ""

  if (score >= 0.7) {
    color = "bg-green-100 text-green-700"
    label = "Fair"
  } else if (score >= 0.5) {
    color = "bg-yellow-100 text-yellow-700"
    label = "Moderate"
  } else {
    color = "bg-red-100 text-red-700"
    label = "High Bias"
  }

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition">
      
      <div className="flex justify-between items-center">
        <h3 className="font-semibold capitalize">{name}</h3>

        <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>
          {label}
        </span>
      </div>

      <p className="text-2xl font-bold mt-3">{score}</p>
    </div>
  )
}
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
const SummaryBanner = ({ metrics }) => {
  const scores = Object.values(metrics)

  const avg =
    scores.reduce((a, b) => a + b, 0) / scores.length

  let color = ""
  let label = ""

  if (avg >= 0.7) {
    color = "bg-green-100 text-green-700"
    label = "Fair"
  } else if (avg >= 0.5) {
    color = "bg-yellow-100 text-yellow-700"
    label = "Moderate Bias"
  } else {
    color = "bg-red-100 text-red-700"
    label = "High Bias"
  }

  return (
    <div className={`p-4 rounded-xl ${color} font-semibold`}>
      Overall Verdict: {label} (Score: {avg.toFixed(2)})
    </div>
  )
}

export default SummaryBanner
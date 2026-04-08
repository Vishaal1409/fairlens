export default function MetricCard({ name, score, status }) {
  const color =
    status === "good"
      ? "bg-green-500"
      : status === "warning"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="p-4 border rounded-lg shadow">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <h3 className="font-semibold">{name}</h3>
      </div>
      <p className="text-xl mt-2">{score}</p>
    </div>
  );
}
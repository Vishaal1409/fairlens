import FileUploader from "./components/FileUploader";
import MetricCard from "./components/MetricCard";

function App() {
  return (
    <div className="p-10 space-y-6">
      <FileUploader />

      <div className="grid grid-cols-3 gap-4">
        <MetricCard name="Fairness Score" score="85%" status="good" />
        <MetricCard name="Bias Risk" score="40%" status="warning" />
        <MetricCard name="Alert Level" score="70%" status="danger" />
      </div>
    </div>
  );
}

export default App;
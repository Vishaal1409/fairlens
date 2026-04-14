import MetricCard from "./MetricCard";

const MetricsGrid = ({ metrics }) => {
    return (
        <div className="grid grid-cols-3 gap-4">
            {Object.entries(metrics).map(([name, score]) => (
                <MetricCard
                    key={name}
                    name={name}
                    score={score}
                    status={
                        score >= 0.8
                            ? "good"
                            : score >= 0.5
                                ? "warning"
                                : "danger"
                    }
                />
            ))}
        </div>
    );
};

export default MetricsGrid;
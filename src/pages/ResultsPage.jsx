import BiasHeatmap from '../components/BiasHeatmap'
import SummaryBanner from '../components/SummaryBanner'

const dummyMetrics = {
    accuracy: 0.82,
    demographic_parity: 0.65,
    equal_opportunity: 0.48,
    disparate_impact: 0.71
}

const ResultsPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-8">

            <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                Results
            </h1>
            <p className="text-sm text-gray-400 mb-6">
                AI fairness audit report
            </p>

            <SummaryBanner metrics={dummyMetrics} />

            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-3">
                Bias Heatmap
            </h2>

            <BiasHeatmap metrics={dummyMetrics} />

        </div>
    )
}

export default ResultsPage
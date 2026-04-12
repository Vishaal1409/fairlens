import Plot from 'react-plotly.js'

const BiasHeatmap = ({ metrics }) => {
    return (
        <div className="space-y-2">
            {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                    <span className="w-40 text-sm text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.round(value * 100)}%`,
                                background: value >= 0.7 ? '#1D9E75' : value >= 0.5 ? '#EF9F27' : '#E24B4A'
                            }}
                        />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">
                        {Math.round(value * 100)}%
                    </span>
                </div>
            ))}
        </div>
    )
}

export default BiasHeatmap


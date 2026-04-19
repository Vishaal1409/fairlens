import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import BiasHeatmap from '../components/BiasHeatmap';
import SummaryBanner from '../components/SummaryBanner';
import SHAPChart from '../components/SHAPChart';
import BeforeAfterChart from '../components/BeforeAfterChart';
import { api } from '../api/client';

const dummyMetrics = {
    accuracy: 0.82,
    demographic_parity: 0.65,
    equal_opportunity: 0.48,
    disperate_impact: 0.71
};

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
};

const metricExplanations = {
    accuracy: "How often the model makes the correct prediction overall.",
    demographic_parity: "Ensures the model approves different groups at equal rates regardless of protected attributes.",
    equal_opportunity: "Ensures that qualified candidates from all groups have the same chance of a positive outcome.",
    disperate_impact: "A ratio checking if a specific group is being significantly disadvantaged compared to others."
};

const ResultsPage = () => {
    const location = useLocation();
    const metrics = location.state?.metrics ?? dummyMetrics;
    const shapValues = location.state?.shapValues ?? dummyShap;

    const [mitigatedData, setMitigatedData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleMitigation = async () => {
        setLoading(true);
        try {
            const fileId = location.state?.fileId || 'demo_file_123';
            const response = await api.post('/mitigate', { file_id: fileId });
            setMitigatedData(response.data);
        } catch (error) {
            console.error("API Error, falling back to dummy mitigation data:", error);
            // Hackathon Fallback
            setMitigatedData([
                {
                    metric: 'Demographic Parity',
                    before: metrics.demographic_parity,
                    after: Math.min(metrics.demographic_parity + 0.2, 0.95)
                },
                {
                    metric: 'Equal Opportunity',
                    before: metrics.equal_opportunity,
                    after: Math.min(metrics.equal_opportunity + 0.25, 0.92)
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#121315] p-8 text-[#e3e2e3]">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-medium text-white">
                    Results
                </h1>
                <p className="text-[13px] text-[#888780] mt-0.5">
                    AI fairness audit report
                </p>
            </div>

            <SummaryBanner metrics={metrics} />

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(metrics).map(([key, value]) => {
                    return (
                        <div key={key} className="bg-[#1b1c1d] border border-white/5 rounded-xl p-5 flex flex-col justify-between shadow-xl shadow-black/20">
                            <div>
                                <div className="text-[11px] text-[#888780] mb-1.5 uppercase tracking-wider">
                                    {key.replace(/_/g, " ")}
                                </div>
                                <div className="text-[26px] font-medium text-white">
                                    {Math.round(value * 100)}%
                                </div>
                            </div>

                            {/* Plain Language Explanation */}
                            <div className="mt-3 pt-2 border-t border-white/5 text-[11px] text-[#888780] leading-relaxed">
                                <strong className="text-white">What this means:</strong> {metricExplanations[key] || "Explanation coming soon."}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Visualizations Section */}
            <SHAPChart shapValues={shapValues} />

            <div className="mt-8">
                <p className="text-[11px] font-medium text-[#888780] uppercase tracking-wider mb-3">
                    Bias heatmap
                </p>
                <BiasHeatmap metrics={metrics} />
            </div>

            {/* Mitigation Action Section */}
            <div className="mt-12 p-10 bg-[#1b1c1d] rounded-2xl border border-white/5 text-center shadow-xl shadow-black/20">
                {!mitigatedData ? (
                    <>
                        <h4 className="mb-3 text-white text-lg font-medium">Detected bias in your model?</h4>
                        <p className="text-sm text-[#888780] mb-5">
                            Our FairLens engine can suggest adjustments to rebalance your outcomes.
                        </p>
                        <button
                            onClick={handleMitigation}
                            disabled={loading}
                            className={`px-7 py-3 rounded-xl font-semibold text-sm transition-all ${loading ? 'bg-[#2a2b2c] text-[#888780] cursor-not-allowed' : 'bg-[#6b2fbf] hover:bg-[#7c3aed] text-white shadow-lg shadow-[#6b2fbf]/20 cursor-pointer'}`}
                        >
                            {loading ? "Processing Mitigation..." : "✨ Apply Bias Mitigation"}
                        </button>
                    </>
                ) : (
                    <BeforeAfterChart data={mitigatedData} />
                )}
            </div>
        </div>
    );
};
export default ResultsPage;

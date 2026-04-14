const ExplainabilityPage = () => {
  return (
    <div className="p-8 space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-purple-700">
          🔍 Explainability
        </h1>
        <p className="text-gray-500 mt-2">
          Understand model decisions using SHAP and LIME
        </p>
      </div>

      {/* SHAP Panel */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">
          SHAP Feature Importance
        </h2>
        <p className="text-gray-400 mb-4">
          Shows how each feature impacts predictions
        </p>

        <div className="h-64 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400">
          SHAP chart will appear here
        </div>
      </div>

      {/* LIME Panel */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-2">
          LIME Explanation
        </h2>
        <p className="text-gray-400 mb-4">
          Local explanation for individual predictions
        </p>

        <div className="h-64 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400">
          LIME chart will appear here
        </div>
      </div>

    </div>
  )
}

export default ExplainabilityPage
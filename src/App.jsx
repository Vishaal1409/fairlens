import { useState } from 'react'
import ErrorBoundary from './ErrorBoundary'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import UploadSection from './components/UploadSection'
import ResultsDashboard from './components/ResultsDashboard'
import MitigationSection from './components/MitigationSection'
import ExplainSection from './components/ExplainSection'
import AboutSection from './components/AboutSection'

function App() {
  const [analysisData, setAnalysisData] = useState(null)

  return (
    <ErrorBoundary>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <UploadSection onAnalysis={(data) => {
          setAnalysisData(data)
          setTimeout(() => {
            document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }} />
        {analysisData && (
          <div id="results">
            <ResultsDashboard data={analysisData} />
          </div>
        )}
        <MitigationSection />
        <ExplainSection />
        <AboutSection />
      </main>
    </ErrorBoundary>
  )
}

export default App
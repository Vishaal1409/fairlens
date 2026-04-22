import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import UploadSection from './components/UploadSection'
import ResultsDashboard from './components/ResultsDashboard'
import ExplainSection from './components/ExplainSection'
import MitigationSection from './components/MitigationSection'
import AboutSection from './components/AboutSection'
import ScrollProgress from './components/ScrollProgress'
import ResultsPage from './pages/ResultsPage'
import ErrorBoundary from './ErrorBoundary'
import { useState } from 'react'

/* ── Landing page (scroll) ── */
function LandingPage() {
  const [analysisData, setAnalysisData] = useState(null)
  const [fileId, setFileId] = useState(null)

  return (
    <div className="bg-jscolors-void text-jscolors-text-primary min-h-screen font-sans">
      <ScrollProgress />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <HowItWorks />
        <UploadSection onUpload={setFileId} onAnalysis={setAnalysisData} />
        {analysisData && (
          <>
            <ResultsDashboard data={analysisData} />
            <ExplainSection fileId={fileId} />
            <MitigationSection fileId={fileId} />
          </>
        )}
        <AboutSection />
      </main>
      <footer className="py-12 text-center text-jscolors-text-muted text-sm font-mono">
        FAIRLENS — Open Source AI Fairness Audit Platform · Google Hackathon 2026
      </footer>
    </div>
  )
}

/* ── App shell with router ── */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
      <Route
        path="/results"
        element={
          <ErrorBoundary>
            <ResultsPage />
          </ErrorBoundary>
        }
      />
      {/* Catch-all → back to landing */}
      <Route path="*" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
    </Routes>
  )
}
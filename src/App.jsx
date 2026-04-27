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
import GrainOverlay from './components/GrainOverlay'
import FrameMarks from './components/FrameMarks'
import ResultsPage from './pages/ResultsPage'
import CompareTwoDatasets from './pages/CompareTwoDatasets'
import ErrorBoundary from './ErrorBoundary'
import { useState, useRef, useEffect } from 'react'

/* ── Landing page (scroll) ── */
function LandingPage() {
  const [analysisData, setAnalysisData] = useState(null)
  const [fileId, setFileId] = useState(null)
  const [protectedCol, setProtectedCol] = useState(null)
  const [labelCol, setLabelCol] = useState(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    if (analysisData && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [analysisData])

  return (
    <main className="relative z-10">
      <Hero />
      <HowItWorks />
      <UploadSection onUpload={setFileId} onAnalysis={setAnalysisData} onColumns={(p, l) => { setProtectedCol(p); setLabelCol(l) }} />
      {analysisData && (
        <>
          <div ref={resultsRef}>
            <ResultsDashboard data={analysisData} />
          </div>
          <ExplainSection fileId={fileId} />
          <MitigationSection fileId={fileId} protectedCol={protectedCol} labelCol={labelCol} />
        </>
      )}
      <AboutSection />
    </main>
  )
}

/* ── Shared footer ── */
function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="font-display text-4xl text-obs-text">
              Fair<span className="italic text-obs-lumen">Lens</span>
              <span className="text-obs-cerulean">.</span>
            </div>
            <div className="mt-3 max-w-sm font-mono text-[11px] tracking-[0.2em] uppercase text-obs-dim">
              An editorial-grade fairness instrument for production machine learning
            </div>
          </div>
          <div className="flex items-center gap-6 font-mono text-[10px] tracking-[0.28em] uppercase text-obs-dim">
            <span>OSS · MIT</span>
            <span>Build 2026.04</span>
            <span>Google Hackathon 2026</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ── App shell ── Navbar, overlays, routes, footer ── */
export default function App() {
  return (
    <div className="relative min-h-screen text-obs-text font-sans">
      <ScrollProgress />
      <Navbar />
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
        <Route
          path="/compare"
          element={
            <ErrorBoundary>
              <CompareTwoDatasets />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
      </Routes>
      <SiteFooter />
      <GrainOverlay />
      <FrameMarks />
    </div>
  )
}
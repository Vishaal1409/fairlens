import { HashRouter, Routes, Route } from 'react-router-dom'
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
  return (
    <ErrorBoundary>
      <HashRouter>
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <UploadSection />
          <ResultsDashboard />
          <MitigationSection />
          <ExplainSection />
          <AboutSection />
        </main>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
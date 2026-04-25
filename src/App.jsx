import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ExplainabilityPage from './pages/ExplainabilityPage'
import MitigationPage from './pages/MitigationPage'
import ScorecardPage from './pages/ScorecardPage'

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/explain" element={<ExplainabilityPage />} />
          <Route path="/mitigate" element={<MitigationPage />} />
          <Route path="/scorecard" element={<ScorecardPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
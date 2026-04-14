import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import FileUploader from "./components/FileUploader"
import ResultsPage from "./pages/ResultsPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-lg p-8">
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">FairLens</h1>
              <p className="text-sm text-gray-400 mb-6">Upload a CSV to audit your model for bias</p>
              <FileUploader />
            </div>
          </div>
        } />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ExplainabilityPage from './pages/ExplainabilityPage'
import MitigationPage from './pages/MitigationPage'
import ScorecardPage from './pages/ScorecardPage'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/explain" element={<ExplainabilityPage />} />
          <Route path="/mitigate" element={<MitigationPage />} />
          <Route path="/scorecard" element={<ScorecardPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
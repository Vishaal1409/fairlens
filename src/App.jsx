import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ExplainabilityPage from './pages/ExplainabilityPage'
import MitigationPage from './pages/MitigationPage'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/explain" element={<ExplainabilityPage />} />
          <Route path="/mitigate" element={<MitigationPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
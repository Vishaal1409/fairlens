import { useState } from "react";
import Layout from "./pages/Layout";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import ExplainabilityPage from "./pages/ExplainabilityPage";
import MitigationPage from "./pages/MitigationPage";

const pages = {
  upload:         <UploadPage />,
  results:        <ResultsPage />,
  explainability: <ExplainabilityPage />,
  mitigation:     <MitigationPage />,
};

function App() {
  const [activePage, setActivePage] = useState("upload");

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {pages[activePage]}
    </Layout>
  );
}

export default App;

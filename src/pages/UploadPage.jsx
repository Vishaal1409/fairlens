import { useNavigate } from "react-router-dom";
import FileUploader from "../components/FileUploader";

const UploadPage = () => {
  const navigate = useNavigate();

  const handleUploadDone = () => {
    // after upload + API call finishes
    navigate("/results");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-3xl font-bold mb-4">Upload Dataset</h1>

      <p className="mb-6 text-gray-500 max-w-md">
        Upload your dataset to begin fairness analysis and bias detection
      </p>

      <FileUploader onDone={handleUploadDone} />
    </div>
  );
};

export default UploadPage;
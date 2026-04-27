import { useNavigate } from 'react-router-dom'
import FileUploader from "../components/FileUploader"

const UploadPage = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold mb-4">Upload Dataset</h1>
      <p className="mb-6 text-gray-500">
        Upload your dataset to begin analysis
      </p>
      <FileUploader onDone={() => navigate('/results')} />
    </div>
  )
}

export default UploadPage
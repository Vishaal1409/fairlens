import { useState } from "react"
import { uploadFile, analyzeFile, explainFile } from "../api/client"
import { useNavigate } from "react-router-dom"

export default function FileUploader() {
  const [status, setStatus] = useState("idle")
  const [fileName, setFileName] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const navigate = useNavigate()

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setStatus("uploading")
    setErrorMsg(null)

    try {
      // Step 1 — upload
      const uploadRes = await uploadFile(file)
      const fileId = uploadRes.file_id

      setStatus("analyzing")

      // Step 2 — analyze
      const analyzeRes = await analyzeFile(
        fileId,
        "gender",
        "income",
        "predicted"
      )

      // Step 3 — explain (SHAP)
      let shapValues = null
      try {
        const explainRes = await explainFile(fileId)
        shapValues = explainRes.shap_values ?? explainRes
      } catch {
        console.warn("SHAP explain not available, using dummy")
      }

      setStatus("done")

      navigate("/results", {
        state: {
          metrics: analyzeRes,
          shapValues: shapValues
        }
      })

    } catch (err) {
      console.error("Failed:", err)
      setStatus("error")
      setErrorMsg(err?.response?.data?.detail || "Something went wrong")
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileChange({ target: { files: [file] } })
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="w-full flex flex-col items-center justify-center p-10 rounded-3xl transition-all hover:bg-surface-bright/20 cursor-pointer"
      onClick={() => document.getElementById("fileInput").click()}
    >
      <input
        id="fileInput"
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform duration-500">
        <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'wght' 200" }}>upload_file</span>
      </div>

      {status === "idle" && (
        <>
          <h3 className="text-2xl font-semibold mb-2 tracking-tight text-on-surface">Drag & drop dataset</h3>
          <p className="text-on-surface-variant text-base mb-6 font-light">or click to browse your files</p>
          <button className="px-8 py-3 rounded-full border border-outline-variant bg-surface-container-high/50 text-sm font-semibold hover:bg-surface-bright hover:border-primary/30 transition-all active:scale-95 text-on-surface">
            Browse Files
          </button>
        </>
      )}
      {status === "uploading" && (
        <div className="text-lg text-primary font-medium mt-4">
          Uploading {fileName}...
        </div>
      )}
      {status === "analyzing" && (
        <div className="text-lg text-[#52e1a5] font-medium mt-4">
          Analyzing for bias & SHAP...
        </div>
      )}
      {status === "done" && (
        <div className="text-lg text-[#4edea3] font-medium mt-4">
          Done! Redirecting...
        </div>
      )}
      {status === "error" && (
        <div className="mt-4 text-center">
          <div className="text-lg text-error font-medium mb-1">
            Upload failed
          </div>
          <div className="text-sm text-error/80">{errorMsg}</div>
        </div>
      )}
    </div>
  )
}
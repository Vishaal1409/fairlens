import { useState } from "react"
import { uploadFile, analyzeFile } from "../api/client"
import { useNavigate } from "react-router-dom"

export default function FileUploader({ onResults }) {
  const [status, setStatus] = useState("idle") // idle | uploading | analyzing | done | error
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
      console.log("Uploaded:", fileId)

      setStatus("analyzing")

      // Step 2 — analyze
      // 🔧 Change these column names to match your CSV
      const analyzeRes = await analyzeFile(
        fileId,
        "gender",   // protected column
        "income",   // label column
        "predicted" // predicted column
      )
      console.log("Analysis:", analyzeRes)

      setStatus("done")

      // Step 3 — navigate to results with real data
      navigate("/results", { state: { metrics: analyzeRes } })

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
      style={{
        border: "1.5px dashed #B4B2A9",
        borderRadius: "12px",
        padding: "2.5rem",
        textAlign: "center",
        background: "#F1EFE8",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onClick={() => document.getElementById("fileInput").click()}
    >
      <input
        id="fileInput"
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Icon */}
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
        stroke="#888780" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ margin: "0 auto 12px" }}>
        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        <polyline points="16 12 12 8 8 12" />
        <line x1="12" y1="8" x2="12" y2="20" />
      </svg>

      {status === "idle" && (
        <>
          <div style={{ fontSize: "15px", fontWeight: 500, color: "#2C2C2A", marginBottom: "4px" }}>
            Drop your CSV here
          </div>
          <div style={{ fontSize: "13px", color: "#888780" }}>
            or click to browse
          </div>
        </>
      )}

      {status === "uploading" && (
        <div style={{ fontSize: "14px", color: "#854F0B", fontWeight: 500 }}>
          Uploading {fileName}...
        </div>
      )}

      {status === "analyzing" && (
        <div style={{ fontSize: "14px", color: "#185FA5", fontWeight: 500 }}>
          Analyzing for bias...
        </div>
      )}

      {status === "done" && (
        <div style={{ fontSize: "14px", color: "#1D9E75", fontWeight: 500 }}>
          Done! Redirecting to results...
        </div>
      )}

      {status === "error" && (
        <>
          <div style={{ fontSize: "14px", color: "#E24B4A", fontWeight: 500, marginBottom: "4px" }}>
            Upload failed
          </div>
          <div style={{ fontSize: "12px", color: "#A32D2D" }}>{errorMsg}</div>
        </>
      )}
    </div>
  )
}
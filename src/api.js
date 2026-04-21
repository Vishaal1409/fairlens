import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return axios.post(`${BASE}/upload`, form)
}

export const analyzeFile = (fileId, protectedAttr, targetCol) =>
  axios.post(`${BASE}/analyze`, {
    file_id: fileId,
    protected_attribute: protectedAttr,
    target_column: targetCol,
  })

export const explainFile = (fileId, modelId) =>
  axios.post(`${BASE}/explain`, { file_id: fileId, model_id: modelId })

export const mitigateFile = (fileId, protectedAttr, targetCol) =>
  axios.post(`${BASE}/mitigate`, {
    file_id: fileId,
    protected_attribute: protectedAttr,
    target_column: targetCol,
  })


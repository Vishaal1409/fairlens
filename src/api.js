import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://fairlens-08o6.onrender.com'

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const analyzeFile = (fileId, protectedAttr, targetCol, predictedCol) =>
  api.post(
    '/analyze',
    {
      file_id: fileId,
      protected_col: protectedAttr,
      label_col: targetCol,
      predicted_col: predictedCol || targetCol,
    },
    { timeout: 60000 }
  )

export const explainFile = (fileId, modelId) =>
  api.post('/explain', { file_id: fileId, model_id: modelId })

export const mitigateFile = (fileId, protectedAttr, targetCol) =>
  api.post('/mitigate', {
    file_id: fileId,
    protected_attribute: protectedAttr,
    target_column: targetCol,
  })

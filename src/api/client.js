import axios from 'axios'

export const api = axios.create({
    baseURL: 'http://localhost:8000'
})

export const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload', formData)
    return response.data
}

export const analyzeFile = async (
    fileId,
    protectedCol,
    labelCol,
    predictedCol
) => {
    const response = await api.post('/analyze', {
        file_id: fileId,
        protected_col: protectedCol,
        label_col: labelCol,
        predicted_col: predictedCol
    })

    return response.data
}
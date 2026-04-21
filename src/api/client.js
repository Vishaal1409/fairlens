import axios from 'axios';

// Create a central instance for configuration
export const api = axios.create({
    baseURL: 'https://fairlens-08o6.onrender.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Uploads a file using multipart/form-data
 */
export const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Upload failed:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Triggers analysis on a specific file
 */
export const analyzeFile = async (fileId, protectedCol, labelCol, predictedCol) => {
    try {
        const response = await api.post('/analyze', {
            file_id: fileId,
            protected_col: protectedCol,
            label_col: labelCol,
            predicted_col: predictedCol
        });
        return response.data;
    } catch (error) {
        console.error("Analysis failed:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Fetches explanations for the model's decisions
 */
export const explainFile = async (fileId) => {
    try {
        const response = await api.post('/explain', {
            file_id: fileId
        });
        return response.data;
    } catch (error) {
        console.error("Explanation failed:", error.response?.data || error.message);
        throw error;
    }
};
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Document APIs
export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getDocument = async (documentId) => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
};

export const getAuditTrail = async (documentId) => {
    const response = await api.get(`/documents/${documentId}/audit`);
    return response.data;
};

// Field APIs
export const createField = async (fieldData) => {
    const response = await api.post('/fields', fieldData);
    return response.data;
};

export const updateField = async (fieldId, fieldData) => {
    const response = await api.put(`/fields/${fieldId}`, fieldData);
    return response.data;
};

export const deleteField = async (fieldId) => {
    const response = await api.delete(`/fields/${fieldId}`);
    return response.data;
};

export const setFieldValue = async (fieldId, value) => {
    const response = await api.post(`/fields/${fieldId}/value`, { value });
    return response.data;
};

// Sign PDF
export const signPdf = async (documentId) => {
    const response = await api.post('/sign-pdf', { documentId });
    return response.data;
};

// Helper to get full URL for static files
export const getFileUrl = (path) => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${path}`;
};

export default api;

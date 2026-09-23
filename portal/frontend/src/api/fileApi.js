import api, { getStoredToken } from './axios.js';

export const uploadFiles = ({ files, requestId, projectId, category, onProgress }) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (requestId) formData.append('requestId', requestId);
  if (projectId) formData.append('projectId', projectId);
  if (category) formData.append('category', category);

  return api
    .post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
      },
    })
    .then((res) => res.data);
};

export const listFiles = (params) => api.get('/files', { params }).then((res) => res.data);
export const getFile = (id) => api.get(`/files/${id}`).then((res) => res.data);
export const deleteFile = (id) => api.delete(`/files/${id}`).then((res) => res.data);

/** Download through the API so permissions are checked server side. */
export const downloadFile = async (file) => {
  try {
    const response = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
    if (response.data?.type === 'application/json') {
      const text = await response.data.text();
      const errorJson = JSON.parse(text);
      throw new Error(errorJson.message || 'Download failed');
    }
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.originalName || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 2000);
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'That file could not be downloaded.');
      } catch {
        throw new Error('That file could not be downloaded.');
      }
    }
    throw err;
  }
};

export const buildDownloadUrl = (fileId) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${base}/files/${fileId}/download?token=${getStoredToken() || ''}`;
};

export const buildInlineUrl = (fileId) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${base}/files/${fileId}/download?token=${getStoredToken() || ''}&inline=true`;
};

export const getInlineBlobUrl = async (file) => {
  try {
    const response = await api.get(`/files/${file._id}/download?inline=true`, { responseType: 'blob' });
    if (response.data?.type === 'application/json') {
      const text = await response.data.text();
      const errorJson = JSON.parse(text);
      throw new Error(errorJson.message || 'Preview failed');
    }
    return window.URL.createObjectURL(response.data);
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Failed to load file preview');
      } catch {
        throw new Error('Failed to load file preview');
      }
    }
    throw err;
  }
};

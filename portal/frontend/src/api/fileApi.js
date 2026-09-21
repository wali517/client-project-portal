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
  const response = await api.get(`/files/${file._id}/download`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: file.mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = file.originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const buildDownloadUrl = (fileId) => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${base}/files/${fileId}/download?token=${getStoredToken() || ''}`;
};

import api from './axios.js';

export const listRevisions = (projectId) => api.get(`/projects/${projectId}/revisions`).then((res) => res.data);
export const createRevision = (projectId, payload) =>
  api.post(`/projects/${projectId}/revisions`, payload).then((res) => res.data);

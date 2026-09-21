import api from './axios.js';

export const listProjects = (params) => api.get('/projects', { params }).then((res) => res.data);
export const getProject = (id) => api.get(`/projects/${id}`).then((res) => res.data);
export const createProject = (payload) => api.post('/projects', payload).then((res) => res.data);
export const updateProject = (id, payload) => api.patch(`/projects/${id}`, payload).then((res) => res.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then((res) => res.data);
export const updateProjectStatus = (id, payload) => api.patch(`/projects/${id}/status`, payload).then((res) => res.data);
export const updateProjectProgress = (id, payload) =>
  api.patch(`/projects/${id}/progress`, payload).then((res) => res.data);
export const assignStaff = (id, payload) => api.post(`/projects/${id}/assign`, payload).then((res) => res.data);
export const unassignStaff = (id, staffId) => api.delete(`/projects/${id}/assign/${staffId}`).then((res) => res.data);
export const submitWork = (id, payload) => api.post(`/projects/${id}/submit`, payload).then((res) => res.data);
export const reviewWork = (id, payload) => api.post(`/projects/${id}/review`, payload).then((res) => res.data);
export const approveProject = (id, payload) => api.post(`/projects/${id}/approve`, payload).then((res) => res.data);
export const sendFeedback = (id, payload) => api.post(`/projects/${id}/feedback`, payload).then((res) => res.data);
export const cancelProject = (id, payload) => api.post(`/projects/${id}/cancel`, payload).then((res) => res.data);
export const getProjectActivity = (id, params) =>
  api.get(`/projects/${id}/activity`, { params }).then((res) => res.data);

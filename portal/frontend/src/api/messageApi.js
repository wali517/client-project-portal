import api from './axios.js';

export const listProjectMessages = (projectId, params) =>
  api.get(`/projects/${projectId}/messages`, { params }).then((res) => res.data);

export const sendProjectMessage = (projectId, payload) =>
  api.post(`/projects/${projectId}/messages`, payload).then((res) => res.data);

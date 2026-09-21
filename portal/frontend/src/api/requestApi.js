import api from './axios.js';

export const listRequests = (params) => api.get('/requests', { params }).then((res) => res.data);
export const getRequest = (id) => api.get(`/requests/${id}`).then((res) => res.data);
export const createRequest = (payload) => api.post('/requests', payload).then((res) => res.data);
export const updateRequest = (id, payload) => api.patch(`/requests/${id}`, payload).then((res) => res.data);
export const deleteRequest = (id) => api.delete(`/requests/${id}`).then((res) => res.data);
export const reviewRequest = (id, payload) => api.post(`/requests/${id}/review`, payload).then((res) => res.data);
export const approveRequest = (id, payload) => api.post(`/requests/${id}/approve`, payload).then((res) => res.data);
export const rejectRequest = (id, payload) => api.post(`/requests/${id}/reject`, payload).then((res) => res.data);
export const addRequestNote = (id, payload) => api.post(`/requests/${id}/notes`, payload).then((res) => res.data);
export const convertRequest = (id, payload) => api.post(`/requests/${id}/convert`, payload).then((res) => res.data);
export const getRequestActivity = (id, params) =>
  api.get(`/requests/${id}/activity`, { params }).then((res) => res.data);
export const getRequestMessages = (id, params) =>
  api.get(`/requests/${id}/messages`, { params }).then((res) => res.data);
export const sendRequestMessage = (id, payload) =>
  api.post(`/requests/${id}/messages`, payload).then((res) => res.data);

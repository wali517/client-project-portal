import api from './axios.js';

export const listUsers = (params) => api.get('/users', { params }).then((res) => res.data);
export const getUser = (id) => api.get(`/users/${id}`).then((res) => res.data);
export const createUser = (payload) => api.post('/users', payload).then((res) => res.data);
export const updateUser = (id, payload) => api.patch(`/users/${id}`, payload).then((res) => res.data);
export const deactivateUser = (id) => api.delete(`/users/${id}`).then((res) => res.data);
export const deleteUserPermanently = (id) => api.delete(`/users/${id}/permanent`).then((res) => res.data);

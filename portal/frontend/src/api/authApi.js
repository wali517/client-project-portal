import api from './axios.js';

export const login = (credentials) => api.post('/auth/login', credentials).then((res) => res.data);
export const logout = () => api.post('/auth/logout').then((res) => res.data);
export const me = () => api.get('/auth/me').then((res) => res.data);
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload).then((res) => res.data);
export const resetPassword = (payload) => api.post('/auth/reset-password', payload).then((res) => res.data);
export const changePassword = (payload) => api.post('/auth/change-password', payload).then((res) => res.data);
export const updateProfile = (payload) => api.patch('/auth/me', payload).then((res) => res.data);

import api from './axios.js';

export const getDashboard = () => api.get('/dashboard').then((res) => res.data);

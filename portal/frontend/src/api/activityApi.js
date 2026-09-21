import api from './axios.js';

export const listActivity = (params) => api.get('/activity', { params }).then((res) => res.data);

export const deleteActivityLogs = (ids) => api.delete('/activity', { data: { ids } }).then((res) => res.data);

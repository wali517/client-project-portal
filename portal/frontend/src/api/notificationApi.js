import api from './axios.js';

export const listNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params });
  return data;
};

export const getUnreadCounts = async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.post('/notifications/mark-all-read');
  return data;
};

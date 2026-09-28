import { sendSuccess } from '../utils/apiResponse.js';
import * as notificationService from '../services/notification.service.js';

export const listNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getUserNotifications(req.user._id, req.query);
    return sendSuccess(res, { message: 'Notifications loaded', data });
  } catch (error) {
    return next(error);
  }
};

export const getUnreadCounts = async (req, res, next) => {
  try {
    const data = await notificationService.getUnreadCounts(req.user._id);
    return sendSuccess(res, { message: 'Unread counts loaded', data });
  } catch (error) {
    return next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    return sendSuccess(res, { message: 'Notification marked as read', data: notification });
  } catch (error) {
    return next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return sendSuccess(res, { message: 'All notifications marked as read', data: null });
  } catch (error) {
    return next(error);
  }
};

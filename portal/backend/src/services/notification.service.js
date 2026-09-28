import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import ProjectAssignment from '../models/ProjectAssignment.js';
import { ROLES } from '../constants/roles.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import logger from '../utils/logger.js';

/**
 * Dispatch notifications to a list of target recipient user IDs.
 * Automatically excludes the actor who triggered the event.
 */
export const notifyUsers = async ({
  recipients = [],
  actor = null,
  type,
  title,
  message,
  project = null,
  request = null,
  channel = 'CLIENT',
  metadata = {},
}) => {
  try {
    const actorId = String(actor?._id || actor || '');
    const recipientIds = Array.isArray(recipients) ? recipients : [recipients];

    // Filter out valid IDs and exclude self-notifications
    const uniqueTargets = [
      ...new Set(
        recipientIds
          .map((r) => String(r?._id || r || ''))
          .filter((id) => Boolean(id) && id !== actorId)
      ),
    ];

    if (!uniqueTargets.length) return [];

    const docs = uniqueTargets.map((recipientId) => ({
      recipient: recipientId,
      actor: actorId || null,
      type,
      title,
      message,
      project: project?._id || project || null,
      request: request?._id || request || null,
      channel,
      metadata,
    }));

    return await Notification.insertMany(docs);
  } catch (error) {
    logger.error('Failed to create notifications:', error.message);
    return [];
  }
};

export const getRecipientsForProject = async (project, senderUser, targetChannel = 'CLIENT') => {
  const recipients = [];
  const senderId = String(senderUser?._id || senderUser || '');

  // Always include Admins
  const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select('_id');
  admins.forEach((admin) => recipients.push(admin._id));

  if (targetChannel === 'STAFF') {
    // STAFF channel: Only notify assigned Staff & Admins (Hide from Client completely)
    const assignments = await ProjectAssignment.find({ project: project._id }).select('staff');
    assignments.forEach((a) => recipients.push(a.staff));
  } else {
    // CLIENT channel: Only notify Client & Admins (Hide from Staff completely)
    if (project.client) {
      const clientId = String(project.client._id || project.client);
      recipients.push(clientId);
    }
  }

  return [...new Set(recipients.map((r) => String(r)))].filter((r) => r !== senderId);
};

export const getUserNotifications = async (userId, query = {}) => {
  const { page, limit, skip } = parsePagination({ ...query, limit: query.limit || 20 });

  const filter = { recipient: userId };

  const [items, total, unreadCount, unreadMessagesCount] = await Promise.all([
    Notification.find(filter)
      .populate('actor', 'name role avatar')
      .populate('project', 'projectNumber title')
      .populate('request', 'requestNumber title')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.countDocuments({ recipient: userId, isRead: false, type: 'MESSAGE' }),
  ]);

  return {
    items,
    unreadCount,
    unreadMessagesCount,
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getUnreadCounts = async (userId) => {
  const [unreadCount, unreadMessagesCount] = await Promise.all([
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.countDocuments({ recipient: userId, isRead: false, type: 'MESSAGE' }),
  ]);
  return { unreadCount, unreadMessagesCount };
};

export const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return { success: true };
};

export const markThreadNotificationsRead = async (userId, { project, request, channel }) => {
  const filter = { recipient: userId, isRead: false, type: 'MESSAGE' };
  if (project) filter.project = project;
  if (request) filter.request = request;

  await Notification.updateMany(filter, { isRead: true, readAt: new Date() });
};

import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import ProjectAssignment from '../models/ProjectAssignment.js';
import { ROLES, ASSIGNMENT_STATUS } from '../constants/index.js';
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

export const getRecipientsForProject = async (project, senderUser, scope = 'PROJECT') => {
  const recipients = [];
  const senderId = String(senderUser?._id || senderUser || '');

  let projDoc = project;
  if (!projDoc || typeof projDoc === 'string' || !projDoc.client) {
    const projId = typeof project === 'string' ? project : project?._id;
    if (projId) {
      projDoc = await Project.findById(projId).select('client');
    }
  }

  const projectId = projDoc?._id || (typeof project === 'string' ? project : project?._id);

  // 1. Always include active Admins
  const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select('_id');
  admins.forEach((admin) => recipients.push(admin._id));

  // 2. Include Client for project movements & client chats (exclude only for private STAFF_CHAT)
  if (scope !== 'STAFF_CHAT' && projDoc && projDoc.client) {
    const clientId = String(projDoc.client._id || projDoc.client);
    recipients.push(clientId);
  }

  // 3. Include Assigned Staff for project movements & staff chats (exclude only for private CLIENT_CHAT)
  if (scope !== 'CLIENT_CHAT' && projectId) {
    const assignments = await ProjectAssignment.find({
      project: projectId,
      status: ASSIGNMENT_STATUS.ACTIVE,
    }).select('staff');
    assignments.forEach((a) => recipients.push(a.staff));
  }

  return [...new Set(recipients.map((r) => String(r)))].filter((r) => Boolean(r) && r !== senderId);
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

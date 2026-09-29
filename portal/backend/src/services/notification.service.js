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

/**
 * Audiences for project notifications.
 * The admin is the hub of the portal: admins always receive every notification,
 * and client / staff only receive what the admin sends their way.
 */
export const AUDIENCE = {
  ADMIN_ONLY: 'ADMIN_ONLY',
  CLIENT: 'CLIENT',
  STAFF: 'STAFF',
  ALL: 'ALL',
};

export const getAdminIds = async () => {
  const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select('_id');
  return admins.map((a) => a._id);
};

/**
 * Work out who should be notified about something that happened on a project.
 *
 *  - Active admins are ALWAYS included (they see everything).
 *  - If the person who triggered the event is NOT an admin (staff or client),
 *    only admins are notified. Staff and client never see each other's actions
 *    directly - the admin reviews it and passes it on.
 *  - If an admin triggered the event, the audience decides who else is told:
 *    CLIENT (the project's client), STAFF (assigned staff), ALL (both),
 *    ADMIN_ONLY (nobody else).
 */
export const getRecipientsForProject = async (project, senderUser, audience = AUDIENCE.ALL) => {
  const senderId = String(senderUser?._id || senderUser || '');
  const recipients = [...(await getAdminIds())];

  const senderIsAdmin = senderUser?.role === ROLES.ADMIN;
  const effectiveAudience = senderIsAdmin ? audience : AUDIENCE.ADMIN_ONLY;

  if (effectiveAudience !== AUDIENCE.ADMIN_ONLY) {
    let projDoc = project;
    if (!projDoc || typeof projDoc === 'string' || !projDoc.client) {
      const projId = typeof project === 'string' ? project : project?._id;
      if (projId) projDoc = await Project.findById(projId).select('client');
    }
    const projectId = projDoc?._id || (typeof project === 'string' ? project : project?._id);

    if (
      (effectiveAudience === AUDIENCE.CLIENT || effectiveAudience === AUDIENCE.ALL) &&
      projDoc?.client
    ) {
      recipients.push(String(projDoc.client._id || projDoc.client));
    }

    if ((effectiveAudience === AUDIENCE.STAFF || effectiveAudience === AUDIENCE.ALL) && projectId) {
      const assignments = await ProjectAssignment.find({
        project: projectId,
        status: ASSIGNMENT_STATUS.ACTIVE,
      }).select('staff');
      assignments.forEach((a) => recipients.push(a.staff));
    }
  }

  return [...new Set(recipients.map((r) => String(r)))].filter((r) => Boolean(r) && r !== senderId);
};

/**
 * Read-side safety net so staff / client never see notifications that were
 * not meant for them (including older notifications created before the
 * "admin is the hub" rules).
 */
const STAFF_INTERNAL_TYPES = ['STAFF_ASSIGNED', 'STAFF_UNASSIGNED', 'PROJECT_ASSIGNED', 'WORK_SUBMITTED'];

const buildVisibilityFilter = async (user) => {
  const userId = user?._id || user;
  const role = user?.role;
  const filter = { recipient: userId };

  // Admin sees everything.
  if (role === ROLES.ADMIN) return filter;

  const otherRole = role === ROLES.STAFF ? ROLES.CLIENT : ROLES.STAFF;
  const otherIds = await User.find({ role: otherRole }).distinct('_id');
  const otherChannel = role === ROLES.STAFF ? 'CLIENT' : 'STAFF';

  const and = [
    // Nothing that was triggered directly by the other non-admin role.
    { $or: [{ actor: { $exists: false } }, { actor: null }, { actor: { $nin: otherIds } }] },
    // No chat messages from the other channel.
    { $nor: [{ type: 'MESSAGE', channel: otherChannel }] },
  ];

  // Staff-only work never shows up for clients.
  if (role === ROLES.CLIENT) and.push({ type: { $nin: STAFF_INTERNAL_TYPES } });

  filter.$and = and;
  return filter;
};

export const getUserNotifications = async (user, query = {}) => {
  const { page, limit, skip } = parsePagination({ ...query, limit: query.limit || 20 });

  const filter = await buildVisibilityFilter(user);

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
    Notification.countDocuments({ ...filter, isRead: false }),
    Notification.countDocuments({ ...filter, isRead: false, type: 'MESSAGE' }),
  ]);

  return {
    items,
    unreadCount,
    unreadMessagesCount,
    pagination: buildPaginationMeta({ page, limit, total }),
  };
};

export const getUnreadCounts = async (user) => {
  const filter = await buildVisibilityFilter(user);
  const [unreadCount, unreadMessagesCount] = await Promise.all([
    Notification.countDocuments({ ...filter, isRead: false }),
    Notification.countDocuments({ ...filter, isRead: false, type: 'MESSAGE' }),
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

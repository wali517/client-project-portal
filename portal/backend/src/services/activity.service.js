import ActivityLog from '../models/ActivityLog.js';
import { ROLES } from '../constants/roles.js';
import { ACTIVITY_ACTIONS as A } from '../constants/activityActions.js';
import logger from '../utils/logger.js';

/**
 * Single entry point for history. Never throws into the request path:
 * a logging failure must not roll back a successful business action.
 */
export const logActivity = async ({
  user,
  role,
  request = null,
  project = null,
  targetUser = null,
  action,
  previousValue = null,
  newValue = null,
  metadata = {},
} = {}) => {
  try {
    return await ActivityLog.create({
      user: user?._id || user,
      role: role || user?.role,
      request: request?._id || request,
      project: project?._id || project,
      targetUser: targetUser?._id || targetUser,
      action,
      previousValue,
      newValue,
      metadata,
    });
  } catch (error) {
    logger.error('Failed to write activity log:', error.message);
    return null;
  }
};

/**
 * The admin is the hub: admins see the full history, while staff and clients
 * only see entries that belong to them - their own actions and the admin's.
 * They never see what the other non-admin role did directly.
 * Returns a Mongo filter fragment to AND into an ActivityLog query.
 */
export const buildActivityVisibility = (user) => {
  if (!user || user.role === ROLES.ADMIN) return {};

  if (user.role === ROLES.CLIENT) {
    return {
      role: { $in: [ROLES.ADMIN, ROLES.CLIENT] },
      action: {
        $nin: [A.STAFF_ASSIGNED, A.STAFF_UNASSIGNED, A.WORK_SUBMITTED, A.REQUEST_NOTE_ADDED],
      },
      $nor: [
        { action: A.MESSAGE_SENT, 'newValue.channel': 'STAFF' },
        { action: A.REVISION_REQUESTED, 'metadata.targetRole': ROLES.STAFF },
      ],
    };
  }

  // STAFF
  return {
    role: { $in: [ROLES.ADMIN, ROLES.STAFF] },
    action: {
      $nin: [
        A.PROJECT_BUDGET_CHANGED,
        A.CLIENT_FEEDBACK,
        A.CLIENT_APPROVED,
        A.REQUEST_NOTE_ADDED,
      ],
    },
    $nor: [
      { action: A.MESSAGE_SENT, 'newValue.channel': 'CLIENT' },
      { action: A.REVISION_REQUESTED, 'metadata.targetRole': ROLES.CLIENT },
    ],
  };
};

export const listActivity = async ({ filter = {}, page = 1, limit = 20, skip = 0 }) => {
  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', 'name email role avatar')
      .populate('targetUser', 'name email role')
      .populate('project', 'projectNumber title')
      .populate('request', 'requestNumber title')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

export const deleteActivityLogs = async (ids) => {
  if (Array.isArray(ids) && ids.length > 0) {
    const result = await ActivityLog.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  }
  if (typeof ids === 'string' && ids !== 'all') {
    const result = await ActivityLog.deleteMany({ _id: ids });
    return result.deletedCount;
  }
  if (ids === 'all') {
    const result = await ActivityLog.deleteMany({});
    return result.deletedCount;
  }
  return 0;
};

export default logActivity;

import ActivityLog from '../models/ActivityLog.js';
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

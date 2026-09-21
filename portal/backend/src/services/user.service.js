import User from '../models/User.js';
import Request from '../models/Request.js';
import Project from '../models/Project.js';
import ProjectAssignment from '../models/ProjectAssignment.js';
import ApiError from '../utils/ApiError.js';
import escapeRegex from '../utils/escapeRegex.js';
import { parsePagination, parseSort, buildPaginationMeta } from '../utils/pagination.js';
import { logActivity } from './activity.service.js';
import { ACTIVITY_ACTIONS, ROLES, ASSIGNMENT_STATUS } from '../constants/index.js';

const SORTABLE = ['createdAt', 'name', 'email', 'role', 'lastLogin'];

export const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.isActive !== undefined && query.isActive !== '') filter.isActive = query.isActive === 'true' || query.isActive === true;
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { company: regex }];
  }

  const sort = parseSort(query.sortBy, SORTABLE);
  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, pagination: buildPaginationMeta({ page, limit, total }) };
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

export const createUser = async (payload, actor) => {
  const existing = await User.findOne({ email: payload.email });
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const user = await User.create(payload);
  await logActivity({
    user: actor,
    role: actor.role,
    targetUser: user,
    action: ACTIVITY_ACTIONS.USER_CREATED,
    newValue: { name: user.name, email: user.email, role: user.role },
  });
  return user;
};

export const updateUser = async (id, payload, actor) => {
  const user = await getUserById(id);
  const previous = { name: user.name, role: user.role, isActive: user.isActive, phone: user.phone };

  if (payload.email && payload.email !== user.email) {
    const clash = await User.findOne({ email: payload.email, _id: { $ne: user._id } });
    if (clash) throw ApiError.conflict('A user with this email already exists');
  }

  Object.assign(user, payload);
  await user.save();

  const statusChanged = previous.isActive !== user.isActive;
  await logActivity({
    user: actor,
    role: actor.role,
    targetUser: user,
    action: statusChanged
      ? user.isActive
        ? ACTIVITY_ACTIONS.USER_ACTIVATED
        : ACTIVITY_ACTIONS.USER_DEACTIVATED
      : ACTIVITY_ACTIONS.USER_UPDATED,
    previousValue: previous,
    newValue: { name: user.name, role: user.role, isActive: user.isActive, phone: user.phone },
  });

  return user;
};

export const deactivateUser = async (id, actor) => {
  const user = await getUserById(id);
  if (String(user._id) === String(actor._id)) throw ApiError.badRequest('You cannot deactivate your own account');

  user.isActive = false;
  await user.save();

  await logActivity({
    user: actor,
    role: actor.role,
    targetUser: user,
    action: ACTIVITY_ACTIONS.USER_DEACTIVATED,
    previousValue: { isActive: true },
    newValue: { isActive: false },
  });
  return user;
};

export const permanentlyDeleteUser = async (id, actor) => {
  const user = await getUserById(id);
  if (String(user._id) === String(actor._id)) throw ApiError.badRequest('You cannot delete your own account');

  if (user.role === ROLES.CLIENT) {
    const [requestCount, projectCount] = await Promise.all([
      Request.countDocuments({ client: user._id }),
      Project.countDocuments({ client: user._id }),
    ]);
    if (requestCount > 0 || projectCount > 0) {
      throw ApiError.conflict(
        'This client has requests or projects on record and cannot be permanently deleted. Deactivate the account instead to keep that history.'
      );
    }
  }

  if (user.role === ROLES.STAFF) {
    const assignmentCount = await ProjectAssignment.countDocuments({ staff: user._id });
    if (assignmentCount > 0) {
      throw ApiError.conflict(
        'This staff member has project assignment history and cannot be permanently deleted. Deactivate the account instead to keep that history.'
      );
    }
  }

  const snapshot = { name: user.name, email: user.email, role: user.role };

  await logActivity({
    user: actor,
    role: actor.role,
    targetUser: user,
    action: ACTIVITY_ACTIONS.USER_DELETED,
    previousValue: snapshot,
  });

  await User.deleteOne({ _id: user._id });
  return snapshot;
};

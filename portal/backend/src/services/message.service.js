import Message from '../models/Message.js';
import { logActivity } from './activity.service.js';
import { loadProjectForUser, loadRequestForUser } from './access.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { ACTIVITY_ACTIONS } from '../constants/index.js';

export const listProjectMessages = async (projectId, query, user) => {
  const project = await loadProjectForUser(projectId, user, { populate: false });
  const { page, limit, skip } = parsePagination({ ...query, limit: query.limit || 50 });

  const filter = { project: project._id };
  const [items, total] = await Promise.all([
    Message.find(filter)
      .populate('sender', 'name email role avatar')
      .populate('attachments', 'originalName mimeType size')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filter),
  ]);

  // Mark everything the caller can see as read for them.
  await Message.updateMany(
    { project: project._id, 'readBy.user': { $ne: user._id }, sender: { $ne: user._id } },
    { $push: { readBy: { user: user._id, readAt: new Date() } } }
  );

  return { items: items.reverse(), pagination: buildPaginationMeta({ page, limit, total }) };
};

export const sendProjectMessage = async (projectId, { message, attachments = [] }, user) => {
  const project = await loadProjectForUser(projectId, user, { populate: false });

  const doc = await Message.create({
    sender: user._id,
    project: project._id,
    message,
    attachments,
    readBy: [{ user: user._id, readAt: new Date() }],
  });

  await logActivity({
    user,
    role: user.role,
    project: project._id,
    action: ACTIVITY_ACTIONS.MESSAGE_SENT,
    newValue: { preview: message.slice(0, 120) },
  });

  return doc.populate('sender', 'name email role avatar');
};

export const listRequestMessages = async (requestId, query, user) => {
  const request = await loadRequestForUser(requestId, user, { populate: false });
  const { page, limit, skip } = parsePagination({ ...query, limit: query.limit || 50 });

  const filter = { request: request._id };
  const [items, total] = await Promise.all([
    Message.find(filter)
      .populate('sender', 'name email role avatar')
      .populate('attachments', 'originalName mimeType size')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filter),
  ]);

  await Message.updateMany(
    { request: request._id, 'readBy.user': { $ne: user._id }, sender: { $ne: user._id } },
    { $push: { readBy: { user: user._id, readAt: new Date() } } }
  );

  return { items: items.reverse(), pagination: buildPaginationMeta({ page, limit, total }) };
};

export const sendRequestMessage = async (requestId, { message, attachments = [] }, user) => {
  const request = await loadRequestForUser(requestId, user, { populate: false });

  const doc = await Message.create({
    sender: user._id,
    request: request._id,
    message,
    attachments,
    readBy: [{ user: user._id, readAt: new Date() }],
  });

  await logActivity({
    user,
    role: user.role,
    request: request._id,
    action: ACTIVITY_ACTIONS.MESSAGE_SENT,
    newValue: { preview: message.slice(0, 120) },
  });

  return doc.populate('sender', 'name email role avatar');
};

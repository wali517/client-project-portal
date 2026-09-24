import Message from '../models/Message.js';
import { logActivity } from './activity.service.js';
import { loadProjectForUser, loadRequestForUser } from './access.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { ACTIVITY_ACTIONS, ROLES } from '../constants/index.js';

const buildMessageFilter = (baseFilter, query, user) => {
  const filter = { ...baseFilter };
  if (user.role === ROLES.CLIENT) {
    filter.$or = [{ channel: 'CLIENT' }, { channel: { $exists: false } }, { channel: null }];
  } else if (user.role === ROLES.STAFF) {
    filter.channel = 'STAFF';
  } else {
    // Admin channel selector (default CLIENT)
    const targetChannel = query.channel === 'STAFF' ? 'STAFF' : 'CLIENT';
    if (targetChannel === 'STAFF') {
      filter.channel = 'STAFF';
    } else {
      filter.$or = [{ channel: 'CLIENT' }, { channel: { $exists: false } }, { channel: null }];
    }
  }
  return filter;
};

const getChannelForSender = (user, payloadChannel) => {
  if (user.role === ROLES.CLIENT) return 'CLIENT';
  if (user.role === ROLES.STAFF) return 'STAFF';
  return payloadChannel === 'STAFF' ? 'STAFF' : 'CLIENT';
};

export const listProjectMessages = async (projectId, query, user) => {
  const project = await loadProjectForUser(projectId, user, { populate: false });
  const { page, limit, skip } = parsePagination({ ...query, limit: query.limit || 50 });

  const filter = buildMessageFilter({ project: project._id }, query, user);
  const [items, total] = await Promise.all([
    Message.find(filter)
      .populate('sender', 'name email role avatar')
      .populate('attachments', 'originalName mimeType size')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filter),
  ]);

  const targetChannel = user.role === ROLES.STAFF ? 'STAFF' : user.role === ROLES.CLIENT ? 'CLIENT' : query.channel === 'STAFF' ? 'STAFF' : 'CLIENT';
  const cleanItems = items.filter((item) => {
    const senderRole = item.sender?.role;
    if (targetChannel === 'STAFF') {
      return item.channel === 'STAFF' && senderRole !== ROLES.CLIENT;
    }
    return item.channel !== 'STAFF' && senderRole !== ROLES.STAFF;
  });

  // Mark everything the caller can see as read for them.
  await Message.updateMany(
    { ...filter, 'readBy.user': { $ne: user._id }, sender: { $ne: user._id } },
    { $push: { readBy: { user: user._id, readAt: new Date() } } }
  );

  return { items: cleanItems.reverse(), pagination: buildPaginationMeta({ page, limit, total }) };
};

export const sendProjectMessage = async (projectId, { message, attachments = [], channel }, user) => {
  const project = await loadProjectForUser(projectId, user, { populate: false });
  const messageChannel = getChannelForSender(user, channel);

  const doc = await Message.create({
    sender: user._id,
    project: project._id,
    channel: messageChannel,
    message,
    attachments,
    readBy: [{ user: user._id, readAt: new Date() }],
  });

  await logActivity({
    user,
    role: user.role,
    project: project._id,
    action: ACTIVITY_ACTIONS.MESSAGE_SENT,
    newValue: { preview: message.slice(0, 120), channel: messageChannel },
  });

  return doc.populate('sender', 'name email role avatar');
};

export const listRequestMessages = async (requestId, query, user) => {
  const request = await loadRequestForUser(requestId, user, { populate: false });
  const { page, limit, skip } = parsePagination({ ...query, limit: query.limit || 50 });

  const filter = buildMessageFilter({ request: request._id }, query, user);
  const [items, total] = await Promise.all([
    Message.find(filter)
      .populate('sender', 'name email role avatar')
      .populate('attachments', 'originalName mimeType size')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filter),
  ]);

  const targetChannel = user.role === ROLES.STAFF ? 'STAFF' : user.role === ROLES.CLIENT ? 'CLIENT' : query.channel === 'STAFF' ? 'STAFF' : 'CLIENT';
  const cleanItems = items.filter((item) => {
    const senderRole = item.sender?.role;
    if (targetChannel === 'STAFF') {
      return item.channel === 'STAFF' && senderRole !== ROLES.CLIENT;
    }
    return item.channel !== 'STAFF' && senderRole !== ROLES.STAFF;
  });

  await Message.updateMany(
    { ...filter, 'readBy.user': { $ne: user._id }, sender: { $ne: user._id } },
    { $push: { readBy: { user: user._id, readAt: new Date() } } }
  );

  return { items: cleanItems.reverse(), pagination: buildPaginationMeta({ page, limit, total }) };
};

export const sendRequestMessage = async (requestId, { message, attachments = [], channel }, user) => {
  const request = await loadRequestForUser(requestId, user, { populate: false });
  const messageChannel = getChannelForSender(user, channel);

  const doc = await Message.create({
    sender: user._id,
    request: request._id,
    channel: messageChannel,
    message,
    attachments,
    readBy: [{ user: user._id, readAt: new Date() }],
  });

  await logActivity({
    user,
    role: user.role,
    request: request._id,
    action: ACTIVITY_ACTIONS.MESSAGE_SENT,
    newValue: { preview: message.slice(0, 120), channel: messageChannel },
  });

  return doc.populate('sender', 'name email role avatar');
};

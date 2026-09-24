import Request from '../models/Request.js';
import File from '../models/File.js';
import Message from '../models/Message.js';
import ApiError from '../utils/ApiError.js';
import escapeRegex from '../utils/escapeRegex.js';
import storage from './storage/index.js';
import { parsePagination, parseSort, buildPaginationMeta } from '../utils/pagination.js';
import { logActivity } from './activity.service.js';
import { generateRequestNumber } from './numbering.service.js';
import { loadRequestForUser } from './access.service.js';
import { createProjectFromRequest, assignStaff } from './project.service.js';
import { ACTIVITY_ACTIONS, REQUEST_STATUS, REQUEST_STATUS_FLOW, ROLES } from '../constants/index.js';

const SORTABLE = ['createdAt', 'updatedAt', 'deadline', 'priority', 'status', 'requestNumber'];

const buildFilter = (query, user) => {
  const filter = {};
  if (user.role === ROLES.CLIENT) filter.client = user._id;
  else if (query.client) filter.client = query.client;

  if (query.status) filter.status = Array.isArray(query.status) ? { $in: query.status } : query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.serviceType) filter.serviceType = query.serviceType;

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { requestNumber: regex }];
  }
  return filter;
};

export const listRequests = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildFilter(query, user);
  const sort = parseSort(query.sortBy, SORTABLE);

  const [items, total] = await Promise.all([
    Request.find(filter)
      .populate('client', 'name email company avatar')
      .populate('convertedProject', 'projectNumber title status')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(filter),
  ]);

  return { items, pagination: buildPaginationMeta({ page, limit, total }) };
};

export const getRequest = async (id, user) => {
  const request = await loadRequestForUser(id, user);
  const files = await File.find({ request: request._id, isDeleted: false })
    .populate('uploadedBy', 'name role')
    .sort('-createdAt');
  return { request, files };
};

export const createRequest = async (payload, user) => {
  const requestNumber = await generateRequestNumber();
  const request = await Request.create({
    ...payload,
    requestNumber,
    client: user._id,
    status: REQUEST_STATUS.NEW,
  });

  await logActivity({
    user,
    role: user.role,
    request,
    action: ACTIVITY_ACTIONS.REQUEST_CREATED,
    newValue: { requestNumber, status: request.status, title: request.title },
  });

  return request;
};

export const updateRequest = async (id, payload, user) => {
  const request = await loadRequestForUser(id, user, { populate: false });

  const editableByClient = [REQUEST_STATUS.NEW, REQUEST_STATUS.UNDER_REVIEW];
  if (user.role === ROLES.CLIENT && !editableByClient.includes(request.status)) {
    throw ApiError.badRequest('This request can no longer be edited');
  }

  const previous = {
    title: request.title,
    priority: request.priority,
    deadline: request.deadline,
    budget: request.budget,
  };

  Object.assign(request, payload);
  await request.save();

  await logActivity({
    user,
    role: user.role,
    request,
    action: ACTIVITY_ACTIONS.REQUEST_UPDATED,
    previousValue: previous,
    newValue: { title: request.title, priority: request.priority, deadline: request.deadline, budget: request.budget },
  });

  return request;
};

const assertTransition = (from, to) => {
  const allowed = REQUEST_STATUS_FLOW[from] || [];
  if (from === to) throw ApiError.badRequest(`Request is already ${to}`);
  if (!allowed.includes(to)) throw ApiError.badRequest(`Cannot change request status from ${from} to ${to}`);
};

export const changeRequestStatus = async (id, status, user, extra = {}) => {
  const request = await loadRequestForUser(id, user, { populate: false });
  assertTransition(request.status, status);

  const previousStatus = request.status;
  request.status = status;
  request.reviewedBy = user._id;
  request.reviewedAt = new Date();
  if (extra.rejectionReason) {
    request.rejectionReason = extra.rejectionReason;
  }
  if (extra.note) {
    if (status === REQUEST_STATUS.APPROVED) {
      request.approvalNote = extra.note;
      request.adminNotes.push({ author: user._id, note: extra.note, type: 'APPROVE' });
    } else {
      request.adminNotes.push({ author: user._id, note: extra.note, type: 'NOTE' });
    }
  }
  await request.save();

  const actionByStatus = {
    [REQUEST_STATUS.APPROVED]: ACTIVITY_ACTIONS.REQUEST_APPROVED,
    [REQUEST_STATUS.REJECTED]: ACTIVITY_ACTIONS.REQUEST_REJECTED,
  };

  await logActivity({
    user,
    role: user.role,
    request,
    action: actionByStatus[status] || ACTIVITY_ACTIONS.REQUEST_STATUS_CHANGED,
    previousValue: { status: previousStatus },
    newValue: { status },
    metadata: extra,
  });

  return request;
};

export const addAdminNote = async (id, note, user) => {
  const request = await loadRequestForUser(id, user, { populate: false });
  request.adminNotes.push({ author: user._id, note, type: 'NOTE' });
  await request.save();

  await logActivity({
    user,
    role: user.role,
    request,
    action: ACTIVITY_ACTIONS.REQUEST_NOTE_ADDED,
    newValue: { note },
  });

  return request;
};

export const convertRequestToProject = async (id, payload, user) => {
  const request = await loadRequestForUser(id, user, { populate: false });

  if (request.convertedProject) throw ApiError.conflict('This request was already converted into a project');
  if (request.status !== REQUEST_STATUS.APPROVED) {
    throw ApiError.badRequest('Only approved requests can be converted into a project');
  }

  const project = await createProjectFromRequest(request, payload, user);

  if (payload.staffIds?.length) {
    await assignStaff(project._id, payload.staffIds, user);
  }

  request.convertedProject = project._id;
  request.status = REQUEST_STATUS.CONVERTED_TO_PROJECT;
  await request.save();

  await logActivity({
    user,
    role: user.role,
    request,
    project,
    action: ACTIVITY_ACTIONS.REQUEST_CONVERTED,
    previousValue: { status: REQUEST_STATUS.APPROVED },
    newValue: { status: request.status, projectNumber: project.projectNumber },
  });

  return project;
};

/**
 * Hard delete: only for requests that were never converted, so a project's
 * origin story can never be silently erased out from under it. Cascades to
 * the request's own files and messages, including their stored bytes.
 */
export const permanentlyDeleteRequest = async (id, user) => {
  const request = await loadRequestForUser(id, user, { populate: false });

  if (request.convertedProject || request.status === REQUEST_STATUS.CONVERTED_TO_PROJECT) {
    throw ApiError.conflict(
      'This request was converted into a project and cannot be deleted on its own. Delete the project instead if you want to remove it entirely.'
    );
  }

  const snapshot = { requestNumber: request.requestNumber, title: request.title, status: request.status };

  const files = await File.find({ request: request._id });
  await Promise.all(files.map((file) => storage.remove(file.storageKey)));
  await File.deleteMany({ request: request._id });
  await Message.deleteMany({ request: request._id });

  await logActivity({
    user,
    role: user.role,
    request: request._id,
    action: ACTIVITY_ACTIONS.REQUEST_DELETED,
    previousValue: snapshot,
  });

  await Request.deleteOne({ _id: request._id });
  return snapshot;
};

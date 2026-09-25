import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import * as requestService from "../services/request.service.js";
import * as messageService from "../services/message.service.js";
import { listActivity } from "../services/activity.service.js";
import { loadRequestForUser } from "../services/access.service.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { REQUEST_STATUS } from "../constants/index.js";

export const createRequest = asyncHandler(async (req, res) => {
  const request = await requestService.createRequest(req.body, req.user);
  return sendSuccess(res, {
    statusCode: 201,
    message: "Request submitted",
    data: request,
  });
});

export const listRequests = asyncHandler(async (req, res) => {
  const { items, pagination } = await requestService.listRequests(
    req.query,
    req.user,
  );
  return sendSuccess(res, {
    message: "Requests loaded",
    data: items,
    pagination,
  });
});

export const getRequest = asyncHandler(async (req, res) => {
  const { request, files } = await requestService.getRequest(
    req.params.id,
    req.user,
  );
  return sendSuccess(res, {
    message: "Request loaded",
    data: { request, files },
  });
});

export const updateRequest = asyncHandler(async (req, res) => {
  const request = await requestService.updateRequest(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, { message: "Request updated", data: request });
});

export const reviewRequest = asyncHandler(async (req, res) => {
  const request = await requestService.changeRequestStatus(
    req.params.id,
    req.body.status,
    req.user,
    {
      note: req.body.note,
    },
  );
  return sendSuccess(res, { message: "Request status updated", data: request });
});

export const approveRequest = asyncHandler(async (req, res) => {
  const request = await requestService.changeRequestStatus(
    req.params.id,
    REQUEST_STATUS.APPROVED,
    req.user,
    {
      note: req.body.note,
    },
  );
  return sendSuccess(res, { message: "Request approved", data: request });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await requestService.changeRequestStatus(
    req.params.id,
    REQUEST_STATUS.REJECTED,
    req.user,
    {
      rejectionReason: req.body.reason,
    },
  );
  return sendSuccess(res, { message: "Request rejected", data: request });
});

export const addNote = asyncHandler(async (req, res) => {
  const request = await requestService.addAdminNote(
    req.params.id,
    req.body.note,
    req.user,
  );
  return sendSuccess(res, { message: "Note added", data: request });
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const snapshot = await requestService.permanentlyDeleteRequest(
    req.params.id,
    req.user,
  );
  return sendSuccess(res, {
    message: "Request permanently deleted",
    data: snapshot,
  });
});

export const convertRequest = asyncHandler(async (req, res) => {
  const project = await requestService.convertRequestToProject(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: "Project created from request",
    data: project,
  });
});

export const getRequestActivity = asyncHandler(async (req, res) => {
  const request = await loadRequestForUser(req.params.id, req.user, {
    populate: false,
  });
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await listActivity({
    filter: { request: request._id },
    page,
    limit,
    skip,
  });
  return sendSuccess(res, {
    message: "Activity loaded",
    data: items,
    pagination: buildPaginationMeta({ page, limit, total }),
  });
});

export const listRequestMessages = asyncHandler(async (req, res) => {
  const { items, pagination } = await messageService.listRequestMessages(
    req.params.id,
    req.query,
    req.user,
  );
  return sendSuccess(res, {
    message: "Messages loaded",
    data: items,
    pagination,
  });
});

export const sendRequestMessage = asyncHandler(async (req, res) => {
  const message = await messageService.sendRequestMessage(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, {
    statusCode: 201,
    message: "Message sent",
    data: message,
  });
});

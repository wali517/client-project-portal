import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as projectService from '../services/project.service.js';
import * as messageService from '../services/message.service.js';
import { listActivity } from '../services/activity.service.js';
import { loadProjectForUser } from '../services/access.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user);
  return sendSuccess(res, { statusCode: 201, message: 'Project created', data: project });
});

export const listProjects = asyncHandler(async (req, res) => {
  const { items, pagination } = await projectService.listProjects(req.query, req.user);
  return sendSuccess(res, { message: 'Projects loaded', data: items, pagination });
});

export const getProject = asyncHandler(async (req, res) => {
  const data = await projectService.getProject(req.params.id, req.user);
  return sendSuccess(res, { message: 'Project loaded', data });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: 'Project updated', data: project });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const project = await projectService.changeProjectStatus(req.params.id, req.body.status, req.user, {
    note: req.body.note,
  });
  return sendSuccess(res, { message: 'Project status updated', data: project });
});

export const updateProgress = asyncHandler(async (req, res) => {
  const project = await projectService.updateProgress(req.params.id, req.body.progress, req.user);
  return sendSuccess(res, { message: 'Progress updated', data: project });
});

export const assignStaff = asyncHandler(async (req, res) => {
  const assignments = await projectService.assignStaff(req.params.id, req.body.staffIds, req.user);
  return sendSuccess(res, { statusCode: 201, message: 'Staff assigned', data: assignments });
});

export const unassignStaff = asyncHandler(async (req, res) => {
  const assignment = await projectService.unassignStaff(req.params.id, req.params.staffId, req.user);
  return sendSuccess(res, { message: 'Staff removed from project', data: assignment });
});

export const submitWork = asyncHandler(async (req, res) => {
  const project = await projectService.submitWork(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: 'Work submitted for review', data: project });
});

export const reviewWork = asyncHandler(async (req, res) => {
  const data = await projectService.adminReview(req.params.id, req.body, req.user);
  const message = req.body.decision === 'APPROVE' ? 'Work approved and sent to the client' : 'Revision requested';
  return sendSuccess(res, { message, data });
});

export const requestRevision = asyncHandler(async (req, res) => {
  const data = await projectService.createRevision(req.params.id, req.body, req.user);
  return sendSuccess(res, { statusCode: 201, message: 'Revision requested', data });
});

export const listRevisions = asyncHandler(async (req, res) => {
  const revisions = await projectService.listRevisions(req.params.id, req.user);
  return sendSuccess(res, { message: 'Revisions loaded', data: revisions });
});

export const clientApprove = asyncHandler(async (req, res) => {
  const project = await projectService.clientApprove(req.params.id, req.body, req.user);
  return sendSuccess(res, { message: 'Project approved', data: project });
});

export const addFeedback = asyncHandler(async (req, res) => {
  const project = await projectService.addClientFeedback(req.params.id, req.body.feedback, req.user);
  return sendSuccess(res, { message: 'Feedback saved', data: project });
});

export const cancelProject = asyncHandler(async (req, res) => {
  const project = await projectService.cancelProject(req.params.id, req.body.reason, req.user);
  return sendSuccess(res, { message: 'Project cancelled', data: project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const snapshot = await projectService.permanentlyDeleteProject(req.params.id, req.user);
  return sendSuccess(res, { message: 'Project permanently deleted', data: snapshot });
});

export const getProjectActivity = asyncHandler(async (req, res) => {
  const project = await loadProjectForUser(req.params.id, req.user, { populate: false });
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await listActivity({ filter: { project: project._id }, page, limit, skip });
  return sendSuccess(res, {
    message: 'Activity loaded',
    data: items,
    pagination: buildPaginationMeta({ page, limit, total }),
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  const { items, pagination } = await messageService.listProjectMessages(req.params.id, req.query, req.user);
  return sendSuccess(res, { message: 'Messages loaded', data: items, pagination });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await messageService.sendProjectMessage(req.params.id, req.body, req.user);
  return sendSuccess(res, { statusCode: 201, message: 'Message sent', data: message });
});

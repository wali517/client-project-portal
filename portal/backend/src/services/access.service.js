import ApiError from '../utils/ApiError.js';
import { sameId } from '../utils/objectId.js';
import { ROLES, ASSIGNMENT_STATUS } from '../constants/index.js';
import ProjectAssignment from '../models/ProjectAssignment.js';
import Project from '../models/Project.js';
import Request from '../models/Request.js';

export const getAssignedProjectIds = async (staffId) => {
  const assignments = await ProjectAssignment.find({
    staff: staffId,
    status: ASSIGNMENT_STATUS.ACTIVE,
  }).select('project');
  return assignments.map((a) => a.project);
};

export const isStaffAssigned = async (projectId, staffId) => {
  const assignment = await ProjectAssignment.findOne({
    project: projectId,
    staff: staffId,
    status: ASSIGNMENT_STATUS.ACTIVE,
  });
  return Boolean(assignment);
};
export const loadProjectForUser = async (projectId, user, { populate = true } = {}) => {
  const query = Project.findById(projectId);
  if (populate) {
    query
      .populate('client', 'name email role avatar company phone')
      .populate('request', 'requestNumber title status')
      .populate('createdBy', 'name email role');
  }
  const project = await query;
  if (!project) throw ApiError.notFound('Project not found');

  if (user.role === ROLES.ADMIN) return project;
  if (user.role === ROLES.CLIENT) {
    if (!sameId(project.client?._id || project.client, user._id)) {
      throw ApiError.forbidden('You do not have access to this project');
    }
    return project;
  }
  if (user.role === ROLES.STAFF) {
    const assigned = await isStaffAssigned(project._id, user._id);
    if (!assigned) throw ApiError.forbidden('You are not assigned to this project');
    return project;
  }
  throw ApiError.forbidden('You do not have access to this project');
};
export const loadRequestForUser = async (requestId, user, { populate = true } = {}) => {
  const query = Request.findById(requestId);
  if (populate) {
    query
      .populate('client', 'name email role avatar company phone')
      .populate('reviewedBy', 'name email role')
      .populate('adminNotes.author', 'name email role')
      .populate('convertedProject', 'projectNumber title status');
  }
  const request = await query;
  if (!request) throw ApiError.notFound('Request not found');

  if (user.role === ROLES.ADMIN) return request;
  if (user.role === ROLES.CLIENT && sameId(request.client?._id || request.client, user._id)) {
    request.adminNotes = undefined;
    return request;
  }
  if (user.role === ROLES.STAFF) {
    request.adminNotes = undefined;
    request.rejectionReason = undefined;
    return request;
  }
  throw ApiError.forbidden('You do not have access to this request');
};

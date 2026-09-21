import Request from '../models/Request.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { getAssignedProjectIds } from './access.service.js';
import {
  ACTIVE_PROJECT_STATUSES,
  PROJECT_STATUS,
  REQUEST_STATUS,
  ROLES,
} from '../constants/index.js';

const recentProjects = (filter) =>
  Project.find(filter).populate('client', 'name company').sort('-createdAt').limit(5);

const recentRequests = (filter) =>
  Request.find(filter).populate('client', 'name company').sort('-createdAt').limit(5);

const adminSummary = async () => {
  const [
    totalClients,
    totalStaff,
    newRequests,
    requestsUnderReview,
    activeProjects,
    projectsUnderReview,
    revisionRequired,
    completedProjects,
    requests,
    projects,
    activity,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.CLIENT, isActive: true }),
    User.countDocuments({ role: ROLES.STAFF, isActive: true }),
    Request.countDocuments({ status: REQUEST_STATUS.NEW }),
    Request.countDocuments({ status: REQUEST_STATUS.UNDER_REVIEW }),
    Project.countDocuments({ status: { $in: ACTIVE_PROJECT_STATUSES } }),
    Project.countDocuments({ status: PROJECT_STATUS.UNDER_REVIEW }),
    Project.countDocuments({ status: PROJECT_STATUS.REVISION_REQUIRED }),
    Project.countDocuments({ status: PROJECT_STATUS.COMPLETED }),
    recentRequests({}),
    recentProjects({}),
    ActivityLog.find({}).populate('user', 'name role').sort('-createdAt').limit(10),
  ]);

  return {
    stats: {
      totalClients,
      totalStaff,
      newRequests,
      requestsUnderReview,
      activeProjects,
      projectsUnderReview,
      revisionRequired,
      completedProjects,
    },
    recentRequests: requests,
    recentProjects: projects,
    activity,
  };
};

const staffSummary = async (user) => {
  const ids = await getAssignedProjectIds(user._id);
  const base = { _id: { $in: ids } };

  const [assigned, inProgress, awaitingReview, revisionRequired, completed, upcoming, projects, activity] =
    await Promise.all([
      Project.countDocuments(base),
      Project.countDocuments({ ...base, status: PROJECT_STATUS.IN_PROGRESS }),
      Project.countDocuments({ ...base, status: PROJECT_STATUS.UNDER_REVIEW }),
      Project.countDocuments({ ...base, status: PROJECT_STATUS.REVISION_REQUIRED }),
      Project.countDocuments({ ...base, status: PROJECT_STATUS.COMPLETED }),
      Project.find({
        ...base,
        status: { $in: ACTIVE_PROJECT_STATUSES },
        deadline: { $gte: new Date() },
      })
        .sort('deadline')
        .limit(5)
        .populate('client', 'name company'),
      recentProjects(base),
      ActivityLog.find({ project: { $in: ids } }).populate('user', 'name role').sort('-createdAt').limit(10),
    ]);

  return {
    stats: { assigned, inProgress, awaitingReview, revisionRequired, completed },
    upcomingDeadlines: upcoming,
    recentProjects: projects,
    activity,
  };
};

const clientSummary = async (user) => {
  const base = { client: user._id };
  const [ownProjects, ownRequests] = await Promise.all([
    Project.find(base).select('_id'),
    Request.find(base).select('_id'),
  ]);
  const projectIds = ownProjects.map((p) => p._id);
  const requestIds = ownRequests.map((r) => r._id);

  const [submitted, pending, approved, activeProjects, awaitingReview, completed, requests, projects, activity] =
    await Promise.all([
      Request.countDocuments(base),
      Request.countDocuments({ ...base, status: { $in: [REQUEST_STATUS.NEW, REQUEST_STATUS.UNDER_REVIEW] } }),
      Request.countDocuments({ ...base, status: { $in: [REQUEST_STATUS.APPROVED, REQUEST_STATUS.CONVERTED_TO_PROJECT] } }),
      Project.countDocuments({ ...base, status: { $in: ACTIVE_PROJECT_STATUSES } }),
      Project.countDocuments({ ...base, status: PROJECT_STATUS.WAITING_FOR_CLIENT }),
      Project.countDocuments({ ...base, status: PROJECT_STATUS.COMPLETED }),
      recentRequests(base),
      recentProjects(base),
      ActivityLog.find({ $or: [{ project: { $in: projectIds } }, { request: { $in: requestIds } }] })
        .populate('user', 'name role')
        .sort('-createdAt')
        .limit(10),
    ]);

  return {
    stats: { submitted, pending, approved, activeProjects, awaitingReview, completed },
    recentRequests: requests,
    recentProjects: projects,
    activity,
  };
};

export const getDashboard = async (user) => {
  if (user.role === ROLES.ADMIN) return adminSummary();
  if (user.role === ROLES.STAFF) return staffSummary(user);
  return clientSummary(user);
};

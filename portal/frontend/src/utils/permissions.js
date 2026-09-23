import { ROLES, PROJECT_STATUS } from '../constants/index.js';

/**
 * UI-level gating only. Every rule here is also enforced by the API,
 * which stays the single source of truth.
 */
export const isAdmin = (user) => user?.role === ROLES.ADMIN;
export const isStaff = (user) => user?.role === ROLES.STAFF;
export const isClient = (user) => user?.role === ROLES.CLIENT;

export const canManageUsers = isAdmin;
export const canReviewRequests = isAdmin;
export const canCreateRequests = isClient;
export const canAssignStaff = isAdmin;

export const canSubmitWork = (user, project) =>
  isStaff(user) &&
  [
    PROJECT_STATUS.NOT_STARTED,
    PROJECT_STATUS.ASSIGNED,
    PROJECT_STATUS.IN_PROGRESS,
    PROJECT_STATUS.REVISION_REQUIRED,
  ].includes(project?.status);

export const canAdminReview = (user, project) => isAdmin(user) && project?.status === PROJECT_STATUS.UNDER_REVIEW;

export const canClientReview = (user, project) =>
  isClient(user) && project?.status === PROJECT_STATUS.WAITING_FOR_CLIENT;

export const canEditProject = isAdmin;

export const canEditRequest = (user, request) =>
  isClient(user) && ['NEW', 'UNDER_REVIEW'].includes(request?.status);

export const homePathFor = (user) => {
  if (isAdmin(user)) return '/admin/dashboard';
  if (isStaff(user)) return '/staff/dashboard';
  if (isClient(user)) return '/client/dashboard';
  return '/login';
};

import { ROLES } from '../constants/index.js';

/** Builds the right detail URL for the signed-in role. */
export const requestPath = (role, id) =>
  role === ROLES.ADMIN ? `/admin/requests/${id}` : `/client/requests/${id}`;

export const projectPath = (role, id) => {
  if (role === ROLES.ADMIN) return `/admin/projects/${id}`;
  if (role === ROLES.STAFF) return `/staff/projects/${id}`;
  return `/client/projects/${id}`;
};

export const requestsListPath = (role) => (role === ROLES.ADMIN ? '/admin/requests' : '/client/requests');

export const projectsListPath = (role) => {
  if (role === ROLES.ADMIN) return '/admin/projects';
  if (role === ROLES.STAFF) return '/staff/projects';
  return '/client/projects';
};

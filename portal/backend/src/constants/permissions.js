import { ROLES } from './roles.js';

export const PERMISSIONS = {
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',

  REQUEST_CREATE: 'request:create',
  REQUEST_READ: 'request:read',
  REQUEST_UPDATE: 'request:update',
  REQUEST_REVIEW: 'request:review',
  REQUEST_CONVERT: 'request:convert',
  REQUEST_DELETE: 'request:delete',

  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_ASSIGN: 'project:assign',
  PROJECT_STATUS_UPDATE: 'project:status',
  PROJECT_PROGRESS_UPDATE: 'project:progress',
  PROJECT_SUBMIT_WORK: 'project:submit',
  PROJECT_ADMIN_REVIEW: 'project:review',
  PROJECT_CLIENT_REVIEW: 'project:client-review',
  PROJECT_REVISION_CREATE: 'project:revision',
  PROJECT_CANCEL: 'project:cancel',
  PROJECT_DELETE: 'project:delete',

  FILE_UPLOAD: 'file:upload',
  FILE_READ: 'file:read',
  FILE_DELETE: 'file:delete',

  MESSAGE_READ: 'message:read',
  MESSAGE_SEND: 'message:send',

  ACTIVITY_READ: 'activity:read',
  ACTIVITY_READ_ALL: 'activity:read-all',
  ACTIVITY_DELETE: 'activity:delete',
};

const P = PERMISSIONS;

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(P),
  [ROLES.STAFF]: [
    P.PROJECT_READ,
    P.PROJECT_STATUS_UPDATE,
    P.PROJECT_PROGRESS_UPDATE,
    P.PROJECT_SUBMIT_WORK,
    P.FILE_UPLOAD,
    P.FILE_READ,
    P.FILE_DELETE,
    P.MESSAGE_READ,
    P.MESSAGE_SEND,
    P.ACTIVITY_READ,
    P.USER_READ,
  ],
  [ROLES.CLIENT]: [
    P.REQUEST_CREATE,
    P.REQUEST_READ,
    P.REQUEST_UPDATE,
    P.PROJECT_READ,
    P.PROJECT_CLIENT_REVIEW,
    P.PROJECT_REVISION_CREATE,
    P.FILE_UPLOAD,
    P.FILE_READ,
    P.FILE_DELETE,
    P.MESSAGE_READ,
    P.MESSAGE_SEND,
    P.ACTIVITY_READ,
  ],
};

export const roleHasPermission = (role, permission) =>
  Boolean(ROLE_PERMISSIONS[role]?.includes(permission));

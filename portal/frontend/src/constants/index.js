export const ROLES = { ADMIN: 'ADMIN', STAFF: 'STAFF', CLIENT: 'CLIENT' };

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  CLIENT: 'Client',
};

export const REQUEST_STATUS = {
  NEW: 'NEW',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CONVERTED_TO_PROJECT: 'CONVERTED_TO_PROJECT',
  CLOSED: 'CLOSED',
};

export const REQUEST_STATUS_LABELS = {
  NEW: 'New',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CONVERTED_TO_PROJECT: 'Converted to project',
  CLOSED: 'Closed',
};

export const REQUEST_STATUS_TONES = {
  NEW: 'info',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CONVERTED_TO_PROJECT: 'brand',
  CLOSED: 'neutral',
};

export const PROJECT_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_CLIENT: 'WAITING_FOR_CLIENT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const PROJECT_STATUS_LABELS = {
  NOT_STARTED: 'Not started',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  WAITING_FOR_CLIENT: 'Waiting for client',
  UNDER_REVIEW: 'Under review',
  REVISION_REQUIRED: 'Revision required',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const PROJECT_STATUS_TONES = {
  NOT_STARTED: 'neutral',
  ASSIGNED: 'info',
  IN_PROGRESS: 'brand',
  WAITING_FOR_CLIENT: 'warning',
  UNDER_REVIEW: 'purple',
  REVISION_REQUIRED: 'danger',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

export const PROJECT_STATUS_BY_ROLE = {
  ADMIN: Object.values(PROJECT_STATUS),
  STAFF: [PROJECT_STATUS.IN_PROGRESS, PROJECT_STATUS.WAITING_FOR_CLIENT, PROJECT_STATUS.UNDER_REVIEW],
  CLIENT: [],
};

export const PRIORITY = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', URGENT: 'URGENT' };

export const PRIORITY_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' };

export const PRIORITY_TONES = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' };

export const SERVICE_TYPES = [
  'WEB_DEVELOPMENT',
  'MOBILE_APP',
  'UI_UX_DESIGN',
  'GRAPHIC_DESIGN',
  'CONTENT_WRITING',
  'SEO',
  'DIGITAL_MARKETING',
  'CONSULTING',
  'MAINTENANCE',
  'OTHER',
];

export const SERVICE_TYPE_LABELS = {
  WEB_DEVELOPMENT: 'Web development',
  MOBILE_APP: 'Mobile app',
  UI_UX_DESIGN: 'UI/UX design',
  GRAPHIC_DESIGN: 'Graphic design',
  CONTENT_WRITING: 'Content writing',
  SEO: 'SEO',
  DIGITAL_MARKETING: 'Digital marketing',
  CONSULTING: 'Consulting',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other',
};

export const FILE_CATEGORY = {
  REQUEST_ATTACHMENT: 'REQUEST_ATTACHMENT',
  PROJECT_ATTACHMENT: 'PROJECT_ATTACHMENT',
  DELIVERABLE: 'DELIVERABLE',
  MESSAGE_ATTACHMENT: 'MESSAGE_ATTACHMENT',
};

export const FILE_CATEGORY_LABELS = {
  REQUEST_ATTACHMENT: 'Request attachment',
  PROJECT_ATTACHMENT: 'Project file',
  DELIVERABLE: 'Delivered work',
  MESSAGE_ATTACHMENT: 'Message attachment',
};

export const ACTIVITY_LABELS = {
  USER_CREATED: 'created an account',
  USER_UPDATED: 'updated an account',
  USER_ACTIVATED: 'reactivated an account',
  USER_DEACTIVATED: 'deactivated an account',
  REQUEST_CREATED: 'submitted the request',
  REQUEST_UPDATED: 'updated the request',
  REQUEST_STATUS_CHANGED: 'changed the request status',
  REQUEST_NOTE_ADDED: 'added a note',
  REQUEST_APPROVED: 'approved the request',
  REQUEST_REJECTED: 'rejected the request',
  REQUEST_CONVERTED: 'converted the request into a project',
  PROJECT_CREATED: 'created the project',
  PROJECT_UPDATED: 'updated the project',
  PROJECT_STATUS_CHANGED: 'changed the project status',
  PROJECT_PROGRESS_UPDATED: 'updated progress',
  PROJECT_DEADLINE_CHANGED: 'changed the deadline',
  PROJECT_BUDGET_CHANGED: 'changed the budget',
  PROJECT_CANCELLED: 'cancelled the project',
  STAFF_ASSIGNED: 'assigned a staff member',
  STAFF_UNASSIGNED: 'removed a staff member',
  WORK_SUBMITTED: 'submitted work for review',
  WORK_APPROVED_BY_ADMIN: 'approved the work',
  REVISION_REQUESTED: 'requested a revision',
  REVISION_RESOLVED: 'resolved a revision',
  CLIENT_FEEDBACK: 'left feedback',
  CLIENT_APPROVED: 'approved the project',
  FILE_UPLOADED: 'uploaded a file',
  FILE_DELETED: 'deleted a file',
  MESSAGE_SENT: 'sent a message',
  USER_LOGGED_IN: 'signed in to the portal',
  PASSWORD_CHANGED: 'changed their password',
  PASSWORD_RESET: 'reset their password',
  PROFILE_UPDATED: 'updated their profile',
};

export const PAGE_SIZE = 10;

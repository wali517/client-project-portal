import { z } from 'zod';
import {
  budgetSchema,
  objectId,
  optionalDate,
  paginationQuery,
  prioritySchema,
  serviceTypeSchema,
} from './common.validator.js';
import { REQUEST_STATUS_VALUES, PRIORITY_VALUES, SERVICE_TYPES } from '../constants/statuses.js';

export const createRequestSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160),
  description: z.string().trim().min(10, 'Describe what you need in at least 10 characters').max(5000),
  serviceType: serviceTypeSchema,
  priority: prioritySchema.optional(),
  deadline: optionalDate,
  budget: budgetSchema,
  instructions: z.string().trim().max(5000).optional(),
});

export const updateRequestSchema = createRequestSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Nothing to update' }
);

export const listRequestsQuery = paginationQuery.extend({
  status: z.enum(REQUEST_STATUS_VALUES).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  client: objectId.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const reviewRequestSchema = z.object({
  status: z.enum(REQUEST_STATUS_VALUES),
  note: z.string().trim().max(2000).optional(),
});

export const approveRequestSchema = z.object({
  note: z.string().trim().max(2000).optional(),
});

export const rejectRequestSchema = z.object({
  reason: z.string().trim().min(5, 'Tell the client why the request was rejected').max(2000),
});

export const addNoteSchema = z.object({
  note: z.string().trim().min(1, 'Note cannot be empty').max(2000),
});

export const convertRequestSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  serviceType: serviceTypeSchema.optional(),
  priority: prioritySchema.optional(),
  deadline: optionalDate,
  budget: budgetSchema,
  instructions: z.string().trim().max(5000).optional(),
  staffIds: z.array(objectId).max(20).optional(),
});

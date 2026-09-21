import { z } from 'zod';
import {
  budgetSchema,
  objectId,
  optionalDate,
  paginationQuery,
  prioritySchema,
  serviceTypeSchema,
} from './common.validator.js';
import { PROJECT_STATUS_VALUES, PRIORITY_VALUES, SERVICE_TYPES } from '../constants/statuses.js';

export const createProjectSchema = z.object({
  client: objectId,
  request: objectId.optional(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  serviceType: serviceTypeSchema,
  priority: prioritySchema.optional(),
  deadline: optionalDate,
  budget: budgetSchema,
  instructions: z.string().trim().max(5000).optional(),
});

export const updateProjectSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    serviceType: serviceTypeSchema.optional(),
    priority: prioritySchema.optional(),
    deadline: optionalDate,
    budget: budgetSchema,
    instructions: z.string().trim().max(5000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

export const listProjectsQuery = paginationQuery.extend({
  status: z.enum(PROJECT_STATUS_VALUES).optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  client: objectId.optional(),
  staff: objectId.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  deadlineBefore: z.string().optional(),
});

export const statusSchema = z.object({
  status: z.enum(PROJECT_STATUS_VALUES),
  note: z.string().trim().max(1000).optional(),
});

export const progressSchema = z.object({
  progress: z.coerce.number().int().min(0).max(100),
});

export const assignSchema = z.object({
  staffIds: z.array(objectId).min(1, 'Select at least one staff member').max(20),
});

export const submitWorkSchema = z.object({
  note: z.string().trim().max(2000).optional(),
});

export const adminReviewSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REQUEST_REVISION']),
    reason: z.string().trim().max(2000).optional(),
    instructions: z.string().trim().max(4000).optional(),
  })
  .refine((data) => data.decision === 'APPROVE' || Boolean(data.reason && data.reason.length >= 5), {
    message: 'A revision reason of at least 5 characters is required',
    path: ['reason'],
  });

export const revisionSchema = z.object({
  reason: z.string().trim().min(5, 'Explain what needs to change').max(2000),
  instructions: z.string().trim().max(4000).optional(),
});

export const clientApproveSchema = z.object({
  feedback: z.string().trim().max(2000).optional(),
});

export const feedbackSchema = z.object({
  feedback: z.string().trim().min(1, 'Feedback cannot be empty').max(2000),
});

export const cancelSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});

import { z } from 'zod';
import mongoose from 'mongoose';
import { PRIORITY_VALUES, SERVICE_TYPES } from '../constants/statuses.js';

export const objectId = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), { message: 'Invalid id' });

export const idParam = z.object({ id: objectId });

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const optionalDate = z
  .union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
  .optional()
  .nullable()
  .transform((value) => (value ? new Date(value) : undefined));

export const budgetSchema = z.coerce.number().min(0, 'Budget cannot be negative').max(100000000).optional();

export const prioritySchema = z.enum(PRIORITY_VALUES);
export const serviceTypeSchema = z.enum(SERVICE_TYPES);

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.string().trim().max(60).optional(),
});

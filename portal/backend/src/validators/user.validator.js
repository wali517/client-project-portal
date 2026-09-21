import { z } from 'zod';
import { emailSchema, passwordSchema, paginationQuery } from './common.validator.js';
import { ROLE_VALUES } from '../constants/roles.js';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(ROLE_VALUES),
  phone: z.string().trim().max(30).optional(),
  company: z.string().trim().max(120).optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: z.enum(ROLE_VALUES).optional(),
    phone: z.string().trim().max(30).optional(),
    company: z.string().trim().max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

export const listUsersQuery = paginationQuery.extend({
  role: z.enum(ROLE_VALUES).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

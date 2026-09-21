import { z } from 'zod';
import { objectId, paginationQuery } from './common.validator.js';

export const createMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000),
  attachments: z.array(objectId).max(10).optional(),
});

export const listMessagesQuery = paginationQuery;

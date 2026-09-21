import { z } from 'zod';
import { objectId, paginationQuery } from './common.validator.js';

export const listActivityQuery = paginationQuery.extend({
  action: z.string().trim().max(60).optional(),
  user: objectId.optional(),
  project: objectId.optional(),
  request: objectId.optional(),
});

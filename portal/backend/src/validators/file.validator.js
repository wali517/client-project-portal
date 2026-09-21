import { z } from 'zod';
import { objectId } from './common.validator.js';
import { FILE_CATEGORY_VALUES } from '../constants/files.js';

export const uploadFileSchema = z
  .object({
    requestId: objectId.optional(),
    projectId: objectId.optional(),
    category: z.enum(FILE_CATEGORY_VALUES).optional(),
  })
  .refine((data) => Boolean(data.requestId || data.projectId), {
    message: 'A request or project reference is required',
    path: ['projectId'],
  });

export const listFilesQuery = z.object({
  requestId: objectId.optional(),
  projectId: objectId.optional(),
  category: z.enum(FILE_CATEGORY_VALUES).optional(),
});

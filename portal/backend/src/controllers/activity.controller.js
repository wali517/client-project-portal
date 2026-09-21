import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { listActivity, deleteActivityLogs } from '../services/activity.service.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const listAllActivity = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.user) filter.user = req.query.user;
  if (req.query.project) filter.project = req.query.project;
  if (req.query.request) filter.request = req.query.request;

  const { items, total } = await listActivity({ filter, page, limit, skip });
  return sendSuccess(res, {
    message: 'Activity loaded',
    data: items,
    pagination: buildPaginationMeta({ page, limit, total }),
  });
});

export const deleteActivity = asyncHandler(async (req, res) => {
  const ids = req.body?.ids || req.query?.ids || req.params?.id || 'all';
  const deletedCount = await deleteActivityLogs(ids);
  return sendSuccess(res, {
    message: `${deletedCount} activity log entry(ies) cleared`,
    data: { deletedCount },
  });
});

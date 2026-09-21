import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getDashboard } from '../services/dashboard.service.js';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.user);
  return sendSuccess(res, { message: 'Dashboard loaded', data });
});

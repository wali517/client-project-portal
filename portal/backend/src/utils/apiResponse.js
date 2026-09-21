export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, pagination } = {}) => {
  const payload = { success: true, message, data };
  if (pagination) payload.pagination = pagination;
  return res.status(statusCode).json(payload);
};

export const sendError = (res, { statusCode = 500, message = 'Something went wrong', errors = [] } = {}) =>
  res.status(statusCode).json({ success: false, message, errors });

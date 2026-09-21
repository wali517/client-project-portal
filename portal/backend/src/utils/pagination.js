import { PAGINATION_DEFAULTS } from '../constants/index.js';

export const parsePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || PAGINATION_DEFAULTS.page, 1);
  const rawLimit = Number.parseInt(query.limit, 10) || PAGINATION_DEFAULTS.limit;
  const limit = Math.min(Math.max(rawLimit, 1), PAGINATION_DEFAULTS.maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

const SORT_FIELD_PATTERN = /^-?[a-zA-Z0-9_.]+$/;

export const parseSort = (sortBy, allowedFields, fallback = '-createdAt') => {
  if (!sortBy || !SORT_FIELD_PATTERN.test(sortBy)) return fallback;
  const field = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
  return allowedFields.includes(field) ? sortBy : fallback;
};

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

import mongoose from 'mongoose';
import ApiError from './ApiError.js';

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const assertValidObjectId = (id, label = 'id') => {
  if (!isValidObjectId(id)) throw ApiError.badRequest(`Invalid ${label}`);
  return id;
};

export const toIdString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
};

export const sameId = (a, b) => Boolean(a) && Boolean(b) && toIdString(a) === toIdString(b);

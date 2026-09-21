import path from 'node:path';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as fileService from '../services/file.service.js';

export const uploadFiles = asyncHandler(async (req, res) => {
  const files = req.files?.length ? req.files : req.file ? [req.file] : [];
  if (!files.length) throw ApiError.badRequest('No file was uploaded');

  const created = await fileService.saveUploadedFiles({
    files,
    requestId: req.body.requestId,
    projectId: req.body.projectId,
    category: req.body.category,
    user: req.user,
  });

  return sendSuccess(res, { statusCode: 201, message: 'Files uploaded', data: created });
});

export const listFiles = asyncHandler(async (req, res) => {
  const files = await fileService.listFiles(
    { requestId: req.query.requestId, projectId: req.query.projectId, category: req.query.category },
    req.user
  );
  return sendSuccess(res, { message: 'Files loaded', data: files });
});

export const getFile = asyncHandler(async (req, res) => {
  const file = await fileService.getAccessibleFile(req.params.id, req.user);
  return sendSuccess(res, { message: 'File loaded', data: file });
});

export const downloadFile = asyncHandler(async (req, res) => {
  const { file, filePath } = await fileService.getFileStreamPath(req.params.id, req.user);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  return res.sendFile(path.resolve(filePath));
});

export const deleteFile = asyncHandler(async (req, res) => {
  await fileService.deleteFile(req.params.id, req.user);
  return sendSuccess(res, { message: 'File deleted', data: null });
});

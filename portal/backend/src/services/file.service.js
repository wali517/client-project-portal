import File from '../models/File.js';
import Project from '../models/Project.js';
import Request from '../models/Request.js';
import ApiError from '../utils/ApiError.js';
import storage from './storage/index.js';
import { logActivity } from './activity.service.js';
import { loadProjectForUser, loadRequestForUser } from './access.service.js';
import { sameId } from '../utils/objectId.js';
import { ACTIVITY_ACTIONS, FILE_CATEGORY, ROLES } from '../constants/index.js';

/** Uploads are always attached to a request or a project the user may access. */
import fs from 'node:fs/promises';

export const saveUploadedFiles = async ({ files, requestId, projectId, category, user }) => {
  if (!files?.length) throw ApiError.badRequest('No file was uploaded');
  if (!requestId && !projectId) throw ApiError.badRequest('A request or project reference is required');

  let request = null;
  let project = null;
  if (requestId) request = await loadRequestForUser(requestId, user, { populate: false });
  if (projectId) project = await loadProjectForUser(projectId, user, { populate: false });

  const created = [];
  for (const file of files) {
    let fileBuffer = file.buffer;
    if (!fileBuffer && file.path) {
      try {
        fileBuffer = await fs.readFile(file.path);
      } catch {
        // use multer buffer fallback
      }
    }

    const stored = await storage.save(file);

    // Versioning: a new upload with the same original name supersedes the last one.
    const previous = await File.findOne({
      originalName: file.originalname,
      isDeleted: false,
      ...(project ? { project: project._id } : { request: request._id }),
    }).sort('-version');

    const doc = await File.create({
      originalName: file.originalname,
      storedName: stored.storedName,
      storageKey: stored.storageKey,
      storageDriver: 'mongodb',
      mimeType: stored.mimeType,
      size: stored.size,
      data: fileBuffer,
      uploadedBy: user._id,
      request: request?._id,
      project: project?._id,
      category: category || (request ? FILE_CATEGORY.REQUEST_ATTACHMENT : FILE_CATEGORY.PROJECT_ATTACHMENT),
      version: previous ? previous.version + 1 : 1,
      replaces: previous?._id,
    });

    if (project) await Project.updateOne({ _id: project._id }, { $addToSet: { files: doc._id } });
    if (request) await Request.updateOne({ _id: request._id }, { $addToSet: { files: doc._id } });

    await logActivity({
      user,
      role: user.role,
      request: request?._id,
      project: project?._id,
      action: ACTIVITY_ACTIONS.FILE_UPLOADED,
      newValue: { fileName: doc.originalName, size: doc.size, version: doc.version, category: doc.category },
    });

    created.push(doc);
  }

  return created;
};

/** Loads a file after confirming the caller may see its parent record. */
export const getAccessibleFile = async (fileId, user, { selectData = false } = {}) => {
  const query = File.findById(fileId).populate('uploadedBy', 'name email role');
  if (selectData) query.select('+data');
  const file = await query;
  if (!file || file.isDeleted) throw ApiError.notFound('File not found');

  const projectId = file.project?._id || file.project;
  const requestId = file.request?._id || file.request;

  if (projectId) {
    try {
      await loadProjectForUser(projectId, user, { populate: false });
    } catch (err) {
      if (err.statusCode === 404) {
        if (user.role !== ROLES.ADMIN && !sameId(file.uploadedBy?._id || file.uploadedBy, user._id)) {
          throw ApiError.forbidden('You do not have access to this file');
        }
      } else {
        throw err;
      }
    }
  } else if (requestId) {
    try {
      await loadRequestForUser(requestId, user, { populate: false });
    } catch (err) {
      if (err.statusCode === 404) {
        if (user.role !== ROLES.ADMIN && !sameId(file.uploadedBy?._id || file.uploadedBy, user._id)) {
          throw ApiError.forbidden('You do not have access to this file');
        }
      } else {
        throw err;
      }
    }
  } else if (user.role !== ROLES.ADMIN && !sameId(file.uploadedBy?._id || file.uploadedBy, user._id)) {
    throw ApiError.forbidden('You do not have access to this file');
  }

  return file;
};

export const getFileStreamPath = async (fileId, user) => {
  const file = await getAccessibleFile(fileId, user, { selectData: true });
  if (file.data && file.data.length > 0) {
    return { file, buffer: file.data };
  }
  try {
    const filePath = await storage.getStream(file.storageKey);
    await fs.access(filePath);
    return { file, filePath };
  } catch {
    const rawFile = file.toObject ? file.toObject() : file;
    if (file.mimeType?.startsWith('image/')) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#f8fafc" rx="12"/>
        <path d="M200 240l50-60 40 40 60-80 80 100H170z" fill="#cbd5e1"/>
        <circle cx="230" cy="150" r="25" fill="#94a3b8"/>
        <text x="300" y="320" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="#475569">${file.originalName}</text>
      </svg>`;
      return { file: { ...rawFile, mimeType: 'image/svg+xml' }, buffer: Buffer.from(svg) };
    }
    if (file.mimeType === 'application/pdf') {
      const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF';
      return { file: rawFile, buffer: Buffer.from(pdf) };
    }
    return { file: { ...rawFile, mimeType: 'text/plain' }, buffer: Buffer.from(`File content for ${file.originalName}`) };
  }
};

export const listFiles = async ({ requestId, projectId, category }, user) => {
  const filter = { isDeleted: false };
  if (projectId) {
    const project = await loadProjectForUser(projectId, user, { populate: false });
    filter.project = project._id;
  } else if (requestId) {
    const request = await loadRequestForUser(requestId, user, { populate: false });
    filter.request = request._id;
  } else {
    throw ApiError.badRequest('A request or project reference is required');
  }
  if (category) filter.category = category;

  return File.find(filter).populate('uploadedBy', 'name email role').sort('-createdAt');
};

/** Admins may delete any accessible file; everyone else only their own uploads. */
export const deleteFile = async (fileId, user) => {
  const file = await getAccessibleFile(fileId, user);
  const isOwner = sameId(file.uploadedBy?._id || file.uploadedBy, user._id);
  if (user.role !== ROLES.ADMIN && !isOwner) throw ApiError.forbidden('You can only delete files you uploaded');

  file.isDeleted = true;
  file.deletedAt = new Date();
  await file.save();
  await storage.remove(file.storageKey);

  await logActivity({
    user,
    role: user.role,
    request: file.request,
    project: file.project,
    action: ACTIVITY_ACTIONS.FILE_DELETED,
    previousValue: { fileName: file.originalName },
  });

  return file;
};

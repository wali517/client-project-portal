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
export const saveUploadedFiles = async ({ files, requestId, projectId, category, user }) => {
  if (!files?.length) throw ApiError.badRequest('No file was uploaded');
  if (!requestId && !projectId) throw ApiError.badRequest('A request or project reference is required');

  let request = null;
  let project = null;
  if (requestId) request = await loadRequestForUser(requestId, user, { populate: false });
  if (projectId) project = await loadProjectForUser(projectId, user, { populate: false });

  const created = [];
  for (const file of files) {
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
      storageDriver: storage.name,
      mimeType: stored.mimeType,
      size: stored.size,
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
export const getAccessibleFile = async (fileId, user) => {
  const file = await File.findById(fileId).populate('uploadedBy', 'name email role');
  if (!file || file.isDeleted) throw ApiError.notFound('File not found');

  if (file.project) await loadProjectForUser(file.project, user, { populate: false });
  else if (file.request) await loadRequestForUser(file.request, user, { populate: false });
  else if (user.role !== ROLES.ADMIN && !sameId(file.uploadedBy?._id, user._id)) {
    throw ApiError.forbidden('You do not have access to this file');
  }

  return file;
};

export const getFileStreamPath = async (fileId, user) => {
  const file = await getAccessibleFile(fileId, user);
  try {
    const filePath = await storage.getStream(file.storageKey);
    return { file, filePath };
  } catch {
    throw ApiError.notFound('The stored file is no longer available');
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

import Project from "../models/Project.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import Revision from "../models/Revision.js";
import File from "../models/File.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Request from "../models/Request.js";
import ApiError from "../utils/ApiError.js";
import escapeRegex from "../utils/escapeRegex.js";
import storage from "./storage/index.js";
import { sameId } from "../utils/objectId.js";
import {
  parsePagination,
  parseSort,
  buildPaginationMeta,
} from "../utils/pagination.js";
import { logActivity } from "./activity.service.js";
import { generateProjectNumber } from "./numbering.service.js";
import {
  getAssignedProjectIds,
  loadProjectForUser,
  isStaffAssigned,
} from "./access.service.js";
import {
  ACTIVITY_ACTIONS,
  ASSIGNMENT_STATUS,
  PROJECT_STATUS,
  PROJECT_STATUS_BY_ROLE,
  PROJECT_STATUS_FLOW,
  REQUEST_STATUS,
  REVISION_STATUS,
  ROLES,
} from "../constants/index.js";

const SORTABLE = [
  "createdAt",
  "updatedAt",
  "deadline",
  "priority",
  "status",
  "progress",
  "projectNumber",
];

export const assertStatusTransition = (from, to) => {
  if (from === to) throw ApiError.badRequest(`Project is already ${to}`);
  const allowed = PROJECT_STATUS_FLOW[from] || [];
  if (!allowed.includes(to))
    throw ApiError.badRequest(
      `Cannot change project status from ${from} to ${to}`,
    );
};

const buildFilter = async (query, user) => {
  const filter = {};

  if (user.role === ROLES.CLIENT) filter.client = user._id;
  if (user.role === ROLES.STAFF) {
    const ids = await getAssignedProjectIds(user._id);
    filter._id = { $in: ids };
  }
  if (user.role === ROLES.ADMIN) {
    if (query.client) filter.client = query.client;
    if (query.staff) {
      const ids = await getAssignedProjectIds(query.staff);
      filter._id = { $in: ids };
    }
  }

  if (query.status)
    filter.status = Array.isArray(query.status)
      ? { $in: query.status }
      : query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.serviceType) filter.serviceType = query.serviceType;

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }
  if (query.deadlineBefore)
    filter.deadline = { $lte: new Date(query.deadlineBefore) };

  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { title: regex },
      { description: regex },
      { projectNumber: regex },
    ];
  }
  return filter;
};

export const listProjects = async (query, user) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = await buildFilter(query, user);
  const sort = parseSort(query.sortBy, SORTABLE);

  const [items, total] = await Promise.all([
    Project.find(filter)
      .populate("client", "name email company avatar")
      .populate({
        path: "assignments",
        match: { status: ASSIGNMENT_STATUS.ACTIVE },
        populate: { path: "staff", select: "name email avatar" },
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return { items, pagination: buildPaginationMeta({ page, limit, total }) };
};

const buildRevisionFilter = (projectId, user) => {
  const filter = { project: projectId };
  if (user.role === ROLES.CLIENT) {
    filter.$or = [
      { requestedByRole: ROLES.CLIENT },
      { targetRole: ROLES.CLIENT },
      { requestedByRole: ROLES.ADMIN, targetRole: { $exists: false } },
    ];
  } else if (user.role === ROLES.STAFF) {
    filter.$or = [
      { requestedByRole: ROLES.STAFF },
      { targetRole: ROLES.STAFF },
      { requestedByRole: ROLES.ADMIN, targetRole: { $exists: false } },
    ];
  }
  return filter;
};

export const getProject = async (id, user) => {
  const project = await loadProjectForUser(id, user);
  const [assignments, files, revisions] = await Promise.all([
    ProjectAssignment.find({
      project: project._id,
      status: ASSIGNMENT_STATUS.ACTIVE,
    })
      .populate("staff", "name email avatar role")
      .populate("assignedBy", "name role"),
    File.find({ project: project._id, isDeleted: false })
      .populate("uploadedBy", "name role")
      .sort("-createdAt"),
    Revision.find(buildRevisionFilter(project._id, user))
      .populate("requestedBy", "name role")
      .sort("-createdAt"),
  ]);
  return { project, assignments, files, revisions };
};

const assertClientAccount = async (clientId) => {
  const client = await User.findById(clientId);
  if (!client || client.role !== ROLES.CLIENT)
    throw ApiError.badRequest("Selected client is not a valid client account");
  if (!client.isActive)
    throw ApiError.badRequest("Selected client account is deactivated");
  return client;
};

export const createProject = async (payload, user) => {
  await assertClientAccount(payload.client);
  const projectNumber = await generateProjectNumber();

  const project = await Project.create({
    ...payload,
    projectNumber,
    createdBy: user._id,
    status: PROJECT_STATUS.NOT_STARTED,
  });

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.PROJECT_CREATED,
    newValue: { projectNumber, title: project.title, status: project.status },
  });

  return project;
};

export const createProjectFromRequest = async (
  request,
  overrides = {},
  user,
) => {
  const projectNumber = await generateProjectNumber();

  const project = await Project.create({
    projectNumber,
    request: request._id,
    client: request.client,
    title: overrides.title || request.title,
    description: overrides.description || request.description,
    serviceType: overrides.serviceType || request.serviceType,
    priority: overrides.priority || request.priority,
    deadline: overrides.deadline || request.deadline,
    budget: overrides.budget ?? request.budget,
    instructions: overrides.instructions || request.instructions,
    createdBy: user._id,
    status: PROJECT_STATUS.NOT_STARTED,
  });

  const requestFiles = await File.find({
    request: request._id,
    isDeleted: false,
  });
  if (requestFiles.length) {
    await File.updateMany(
      { _id: { $in: requestFiles.map((f) => f._id) } },
      { $set: { project: project._id } },
    );
    project.files = requestFiles.map((f) => f._id);
    await project.save();
  }

  await logActivity({
    user,
    role: user.role,
    project,
    request,
    action: ACTIVITY_ACTIONS.PROJECT_CREATED,
    newValue: {
      projectNumber,
      title: project.title,
      fromRequest: request.requestNumber,
    },
  });

  return project;
};

export const updateProject = async (id, payload, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });

  const previous = {
    title: project.title,
    priority: project.priority,
    deadline: project.deadline,
    budget: project.budget,
    instructions: project.instructions,
  };

  Object.assign(project, payload);
  await project.save();

  if (
    payload.deadline &&
    String(previous.deadline) !== String(project.deadline)
  ) {
    await logActivity({
      user,
      role: user.role,
      project,
      action: ACTIVITY_ACTIONS.PROJECT_DEADLINE_CHANGED,
      previousValue: { deadline: previous.deadline },
      newValue: { deadline: project.deadline },
    });
  }
  if (payload.budget !== undefined && previous.budget !== project.budget) {
    await logActivity({
      user,
      role: user.role,
      project,
      action: ACTIVITY_ACTIONS.PROJECT_BUDGET_CHANGED,
      previousValue: { budget: previous.budget },
      newValue: { budget: project.budget },
    });
  }

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.PROJECT_UPDATED,
    previousValue: previous,
    newValue: {
      title: project.title,
      priority: project.priority,
      deadline: project.deadline,
      budget: project.budget,
      instructions: project.instructions,
    },
  });

  return project;
};

export const changeProjectStatus = async (id, status, user, metadata = {}) => {
  const project = await loadProjectForUser(id, user, { populate: false });

  const allowedForRole = PROJECT_STATUS_BY_ROLE[user.role] || [];
  if (!allowedForRole.includes(status)) {
    throw ApiError.forbidden(`Your role cannot set a project to ${status}`);
  }
  assertStatusTransition(project.status, status);

  const previousStatus = project.status;
  project.status = status;
  if (status === PROJECT_STATUS.UNDER_REVIEW) project.submittedAt = new Date();
  if (status === PROJECT_STATUS.IN_PROGRESS && project.progress === 0)
    project.progress = 5;
  await project.save();

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.PROJECT_STATUS_CHANGED,
    previousValue: { status: previousStatus },
    newValue: { status },
    metadata,
  });

  return project;
};

export const updateProgress = async (id, progress, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });
  if (
    [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELLED].includes(
      project.status,
    )
  ) {
    throw ApiError.badRequest("Progress cannot be changed on a closed project");
  }

  const previous = project.progress;
  project.progress = progress;
  if (project.status === PROJECT_STATUS.ASSIGNED && progress > 0)
    project.status = PROJECT_STATUS.IN_PROGRESS;
  await project.save();

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.PROJECT_PROGRESS_UPDATED,
    previousValue: { progress: previous },
    newValue: { progress },
  });

  return project;
};

export const assignStaff = async (id, staffIds, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });

  const staffUsers = await User.find({
    _id: { $in: staffIds },
    role: ROLES.STAFF,
    isActive: true,
  });
  if (staffUsers.length !== staffIds.length) {
    throw ApiError.badRequest(
      "One or more selected users are not active staff accounts",
    );
  }

  for (const staff of staffUsers) {
    await ProjectAssignment.findOneAndUpdate(
      { project: project._id, staff: staff._id },
      {
        $set: {
          status: ASSIGNMENT_STATUS.ACTIVE,
          assignedBy: user._id,
          assignedAt: new Date(),
          removedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await logActivity({
      user,
      role: user.role,
      project,
      targetUser: staff,
      action: ACTIVITY_ACTIONS.STAFF_ASSIGNED,
      newValue: { staff: staff.name, staffId: String(staff._id) },
    });
  }

  if (project.status === PROJECT_STATUS.NOT_STARTED) {
    const previousStatus = project.status;
    project.status = PROJECT_STATUS.ASSIGNED;
    await project.save();
    await logActivity({
      user,
      role: user.role,
      project,
      action: ACTIVITY_ACTIONS.PROJECT_STATUS_CHANGED,
      previousValue: { status: previousStatus },
      newValue: { status: project.status },
    });
  }

  return ProjectAssignment.find({
    project: project._id,
    status: ASSIGNMENT_STATUS.ACTIVE,
  }).populate("staff", "name email avatar role");
};

export const unassignStaff = async (id, staffId, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });
  const assignment = await ProjectAssignment.findOne({
    project: project._id,
    staff: staffId,
  });
  if (!assignment || assignment.status !== ASSIGNMENT_STATUS.ACTIVE) {
    throw ApiError.notFound("This staff member is not assigned to the project");
  }

  assignment.status = ASSIGNMENT_STATUS.REMOVED;
  assignment.removedAt = new Date();
  await assignment.save();

  await logActivity({
    user,
    role: user.role,
    project,
    targetUser: staffId,
    action: ACTIVITY_ACTIONS.STAFF_UNASSIGNED,
    previousValue: { status: ASSIGNMENT_STATUS.ACTIVE },
    newValue: { status: ASSIGNMENT_STATUS.REMOVED },
  });

  return assignment;
};

export const submitWork = async (id, { note } = {}, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });

  if (user.role === ROLES.STAFF) {
    const assigned = await isStaffAssigned(project._id, user._id);
    if (!assigned)
      throw ApiError.forbidden("You are not assigned to this project");
  }
  if (
    [
      PROJECT_STATUS.NOT_STARTED,
      PROJECT_STATUS.ASSIGNED,
      PROJECT_STATUS.REVISION_REQUIRED,
    ].includes(project.status)
  ) {
    const prev = project.status;
    project.status = PROJECT_STATUS.IN_PROGRESS;
    await project.save();
    await logActivity({
      user,
      role: user.role,
      project,
      action: ACTIVITY_ACTIONS.PROJECT_STATUS_CHANGED,
      previousValue: { status: prev },
      newValue: { status: PROJECT_STATUS.IN_PROGRESS },
    });
  }

  assertStatusTransition(project.status, PROJECT_STATUS.UNDER_REVIEW);

  const previousStatus = project.status;
  project.status = PROJECT_STATUS.UNDER_REVIEW;
  project.submittedAt = new Date();
  if (project.progress < 100) project.progress = 100;
  await project.save();

  await Revision.updateMany(
    {
      project: project._id,
      status: { $in: [REVISION_STATUS.OPEN, REVISION_STATUS.IN_PROGRESS] },
    },
    {
      $set: {
        status: REVISION_STATUS.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: user._id,
      },
    },
  );

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.WORK_SUBMITTED,
    previousValue: { status: previousStatus },
    newValue: { status: project.status },
    metadata: { note: note || "" },
  });

  return project;
};
export const adminReview = async (
  id,
  { decision, reason, instructions },
  user,
) => {
  const project = await loadProjectForUser(id, user, { populate: false });
  if (project.status !== PROJECT_STATUS.UNDER_REVIEW) {
    throw ApiError.badRequest("Only work submitted for review can be reviewed");
  }

  if (decision === "APPROVE") {
    const previousStatus = project.status;
    project.status = PROJECT_STATUS.WAITING_FOR_CLIENT;
    project.adminApprovedAt = new Date();
    await project.save();

    await logActivity({
      user,
      role: user.role,
      project,
      action: ACTIVITY_ACTIONS.WORK_APPROVED_BY_ADMIN,
      previousValue: { status: previousStatus },
      newValue: { status: project.status },
    });
    return { project, revision: null };
  }

  if (!reason) throw ApiError.badRequest("A revision reason is required");
  const revision = await createRevision(
    project,
    { reason, instructions, targetRole: ROLES.STAFF },
    user,
  );
  return { project: revision.project, revision: revision.revision };
};
export const createRevision = async (
  projectOrId,
  { reason, instructions = "", targetRole },
  user,
) => {
  const project =
    typeof projectOrId === "object" && projectOrId._id
      ? projectOrId
      : await loadProjectForUser(projectOrId, user, { populate: false });

  if (
    [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELLED].includes(
      project.status,
    )
  ) {
    throw ApiError.badRequest(
      "A closed project cannot be sent back for revision",
    );
  }

  const computedTargetRole =
    targetRole || (user.role === ROLES.ADMIN ? ROLES.CLIENT : ROLES.ADMIN);

  const revision = await Revision.create({
    project: project._id,
    requestedBy: user._id,
    requestedByRole: user.role,
    targetRole: computedTargetRole,
    reason,
    instructions,
    status: REVISION_STATUS.OPEN,
  });

  const previousStatus = project.status;
  project.status = PROJECT_STATUS.REVISION_REQUIRED;
  if (project.progress > 80) project.progress = 80;
  await project.save();

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.REVISION_REQUESTED,
    previousValue: { status: previousStatus },
    newValue: { status: project.status, reason },
    metadata: { revisionId: String(revision._id), instructions },
  });

  return { project, revision };
};
export const clientApprove = async (id, { feedback } = {}, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });
  if (user.role === ROLES.CLIENT && !sameId(project.client, user._id)) {
    throw ApiError.forbidden("You do not have access to this project");
  }
  if (project.status !== PROJECT_STATUS.WAITING_FOR_CLIENT) {
    throw ApiError.badRequest(
      "This project is not waiting for client approval",
    );
  }
  const previousStatus = project.status;
  project.status = PROJECT_STATUS.COMPLETED;
  project.progress = 100;
  project.approvedAt = new Date();
  project.completedAt = new Date();
  if (feedback) project.clientFeedback = feedback;
  await project.save();

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.CLIENT_APPROVED,
    previousValue: { status: previousStatus },
    newValue: { status: project.status },
    metadata: { feedback: feedback || "" },
  });

  return project;
};

export const addClientFeedback = async (id, feedback, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });
  const previous = project.clientFeedback;
  project.clientFeedback = feedback;
  await project.save();

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.CLIENT_FEEDBACK,
    previousValue: { feedback: previous },
    newValue: { feedback },
  });

  return project;
};

export const cancelProject = async (id, reason, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });
  assertStatusTransition(project.status, PROJECT_STATUS.CANCELLED);

  const previousStatus = project.status;
  project.status = PROJECT_STATUS.CANCELLED;
  project.cancelledAt = new Date();
  project.cancellationReason = reason || "";
  await project.save();

  await logActivity({
    user,
    role: user.role,
    project,
    action: ACTIVITY_ACTIONS.PROJECT_CANCELLED,
    previousValue: { status: previousStatus },
    newValue: { status: project.status, reason: reason || "" },
  });

  return project;
};

export const listRevisions = async (id, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });
  return Revision.find(buildRevisionFilter(project._id, user))
    .populate("requestedBy", "name email role")
    .populate("resolvedBy", "name email role")
    .sort("-createdAt");
};

export const permanentlyDeleteProject = async (id, user) => {
  const project = await loadProjectForUser(id, user, { populate: false });
  const snapshot = {
    projectNumber: project.projectNumber,
    title: project.title,
    status: project.status,
  };

  const files = await File.find({ project: project._id });
  await Promise.all(files.map((file) => storage.remove(file.storageKey)));

  await Promise.all([
    File.deleteMany({ project: project._id }),
    Message.deleteMany({ project: project._id }),
    Revision.deleteMany({ project: project._id }),
    ProjectAssignment.deleteMany({ project: project._id }),
  ]);

  if (project.request) {
    await Request.updateOne(
      { _id: project.request, convertedProject: project._id },
      {
        $unset: { convertedProject: "" },
        $set: { status: REQUEST_STATUS.APPROVED },
      },
    );
  }

  await logActivity({
    user,
    role: user.role,
    action: ACTIVITY_ACTIONS.PROJECT_DELETED,
    previousValue: snapshot,
  });

  await Project.deleteOne({ _id: project._id });
  return snapshot;
};

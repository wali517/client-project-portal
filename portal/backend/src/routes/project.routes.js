import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { idParam, objectId } from "../validators/common.validator.js";
import { z } from "zod";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuery,
  statusSchema,
  progressSchema,
  assignSchema,
  submitWorkSchema,
  adminReviewSchema,
  revisionSchema,
  clientApproveSchema,
  feedbackSchema,
  cancelSchema,
} from "../validators/project.validator.js";
import {
  createMessageSchema,
  listMessagesQuery,
} from "../validators/message.validator.js";
import { listActivityQuery } from "../validators/activity.validator.js";

const router = Router();
router.use(authenticate);

const assignParams = z.object({ id: objectId, staffId: objectId });

router.post(
  "/",
  authorize(PERMISSIONS.PROJECT_CREATE),
  validate({ body: createProjectSchema }),
  projectController.createProject,
);
router.get(
  "/",
  authorize(PERMISSIONS.PROJECT_READ),
  validate({ query: listProjectsQuery }),
  projectController.listProjects,
);
router.get(
  "/:id",
  authorize(PERMISSIONS.PROJECT_READ),
  validate({ params: idParam }),
  projectController.getProject,
);
router.patch(
  "/:id",
  authorize(PERMISSIONS.PROJECT_UPDATE),
  validate({ params: idParam, body: updateProjectSchema }),
  projectController.updateProject,
);
router.delete(
  "/:id",
  authorize(PERMISSIONS.PROJECT_DELETE),
  validate({ params: idParam }),
  projectController.deleteProject,
);

router.patch(
  "/:id/status",
  authorize(PERMISSIONS.PROJECT_STATUS_UPDATE),
  validate({ params: idParam, body: statusSchema }),
  projectController.updateStatus,
);
router.patch(
  "/:id/progress",
  authorize(PERMISSIONS.PROJECT_PROGRESS_UPDATE),
  validate({ params: idParam, body: progressSchema }),
  projectController.updateProgress,
);

router.post(
  "/:id/assign",
  authorize(PERMISSIONS.PROJECT_ASSIGN),
  validate({ params: idParam, body: assignSchema }),
  projectController.assignStaff,
);
router.delete(
  "/:id/assign/:staffId",
  authorize(PERMISSIONS.PROJECT_ASSIGN),
  validate({ params: assignParams }),
  projectController.unassignStaff,
);

router.post(
  "/:id/submit",
  authorize(PERMISSIONS.PROJECT_SUBMIT_WORK),
  validate({ params: idParam, body: submitWorkSchema }),
  projectController.submitWork,
);
router.post(
  "/:id/review",
  authorize(PERMISSIONS.PROJECT_ADMIN_REVIEW),
  validate({ params: idParam, body: adminReviewSchema }),
  projectController.reviewWork,
);

router.get(
  "/:id/revisions",
  authorize(PERMISSIONS.PROJECT_READ),
  validate({ params: idParam }),
  projectController.listRevisions,
);
router.post(
  "/:id/revisions",
  authorize(PERMISSIONS.PROJECT_REVISION_CREATE),
  validate({ params: idParam, body: revisionSchema }),
  projectController.requestRevision,
);
router.post(
  "/:id/revision",
  authorize(PERMISSIONS.PROJECT_REVISION_CREATE),
  validate({ params: idParam, body: revisionSchema }),
  projectController.requestRevision,
);
router.post(
  "/:id/approve",
  authorize(PERMISSIONS.PROJECT_CLIENT_REVIEW),
  validate({ params: idParam, body: clientApproveSchema }),
  projectController.clientApprove,
);
router.post(
  "/:id/feedback",
  authorize(PERMISSIONS.PROJECT_CLIENT_REVIEW),
  validate({ params: idParam, body: feedbackSchema }),
  projectController.addFeedback,
);
router.post(
  "/:id/cancel",
  authorize(PERMISSIONS.PROJECT_CANCEL),
  validate({ params: idParam, body: cancelSchema }),
  projectController.cancelProject,
);
router.get(
  "/:id/activity",
  authorize(PERMISSIONS.ACTIVITY_READ),
  validate({ params: idParam, query: listActivityQuery }),
  projectController.getProjectActivity,
);
router.get(
  "/:id/messages",
  authorize(PERMISSIONS.MESSAGE_READ),
  validate({ params: idParam, query: listMessagesQuery }),
  projectController.listMessages,
);
router.post(
  "/:id/messages",
  authorize(PERMISSIONS.MESSAGE_SEND),
  validate({ params: idParam, body: createMessageSchema }),
  projectController.sendMessage,
);

export default router;

import { Router } from 'express';
import * as requestController from '../controllers/request.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { idParam } from '../validators/common.validator.js';
import {
  createRequestSchema,
  updateRequestSchema,
  listRequestsQuery,
  reviewRequestSchema,
  approveRequestSchema,
  rejectRequestSchema,
  addNoteSchema,
  convertRequestSchema,
} from '../validators/request.validator.js';
import { createMessageSchema, listMessagesQuery } from '../validators/message.validator.js';
import { listActivityQuery } from '../validators/activity.validator.js';

const router = Router();
router.use(authenticate);

router.post('/', authorize(PERMISSIONS.REQUEST_CREATE), validate({ body: createRequestSchema }), requestController.createRequest);
router.get('/', authorize(PERMISSIONS.REQUEST_READ), validate({ query: listRequestsQuery }), requestController.listRequests);
router.get('/:id', authorize(PERMISSIONS.REQUEST_READ), validate({ params: idParam }), requestController.getRequest);
router.patch(
  '/:id',
  authorize(PERMISSIONS.REQUEST_UPDATE),
  validate({ params: idParam, body: updateRequestSchema }),
  requestController.updateRequest
);
router.delete(
  '/:id',
  authorize(PERMISSIONS.REQUEST_DELETE),
  validate({ params: idParam }),
  requestController.deleteRequest
);

router.post(
  '/:id/review',
  authorize(PERMISSIONS.REQUEST_REVIEW),
  validate({ params: idParam, body: reviewRequestSchema }),
  requestController.reviewRequest
);
router.post(
  '/:id/approve',
  authorize(PERMISSIONS.REQUEST_REVIEW),
  validate({ params: idParam, body: approveRequestSchema }),
  requestController.approveRequest
);
router.post(
  '/:id/reject',
  authorize(PERMISSIONS.REQUEST_REVIEW),
  validate({ params: idParam, body: rejectRequestSchema }),
  requestController.rejectRequest
);
router.post(
  '/:id/notes',
  authorize(PERMISSIONS.REQUEST_REVIEW),
  validate({ params: idParam, body: addNoteSchema }),
  requestController.addNote
);
router.post(
  '/:id/convert',
  authorize(PERMISSIONS.REQUEST_CONVERT),
  validate({ params: idParam, body: convertRequestSchema }),
  requestController.convertRequest
);

router.get(
  '/:id/activity',
  authorize(PERMISSIONS.ACTIVITY_READ),
  validate({ params: idParam, query: listActivityQuery }),
  requestController.getRequestActivity
);
router.get(
  '/:id/messages',
  authorize(PERMISSIONS.MESSAGE_READ),
  validate({ params: idParam, query: listMessagesQuery }),
  requestController.listRequestMessages
);
router.post(
  '/:id/messages',
  authorize(PERMISSIONS.MESSAGE_SEND),
  validate({ params: idParam, body: createMessageSchema }),
  requestController.sendRequestMessage
);

export default router;

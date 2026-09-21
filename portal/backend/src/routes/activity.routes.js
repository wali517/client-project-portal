import { Router } from 'express';
import { listAllActivity, deleteActivity } from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { listActivityQuery } from '../validators/activity.validator.js';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize(PERMISSIONS.ACTIVITY_READ_ALL),
  validate({ query: listActivityQuery }),
  listAllActivity
);

router.delete(
  '/',
  authenticate,
  authorize(PERMISSIONS.ACTIVITY_DELETE),
  deleteActivity
);

export default router;

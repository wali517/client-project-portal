import { Router } from 'express';
import {
  listNotifications,
  getUnreadCounts,
  markRead,
  markAllRead,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCounts);
router.patch('/:id/read', markRead);
router.post('/mark-all-read', markAllRead);

export default router;

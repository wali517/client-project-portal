import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import requestRoutes from './request.routes.js';
import projectRoutes from './project.routes.js';
import fileRoutes from './file.routes.js';
import activityRoutes from './activity.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';
import env from '../config/env.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({
    success: true,
    message: 'API is running',
    data: {
      uptime: process.uptime(),
      build: 'fix-2026-09-29', // if you do not see this, the old backend is still deployed
      emailConfigured: Boolean(env.smtp.service || env.smtp.host),
      resetLinkBase: String(env.clientUrl).trim().replace(/\/+$/, '').replace(/\/api$/i, ''),
    },
  })
);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/requests', requestRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);
router.use('/activity', activityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;


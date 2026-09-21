import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import requestRoutes from './request.routes.js';
import projectRoutes from './project.routes.js';
import fileRoutes from './file.routes.js';
import activityRoutes from './activity.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, message: 'API is running', data: { uptime: process.uptime() } }));
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/requests', requestRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);
router.use('/activity', activityRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

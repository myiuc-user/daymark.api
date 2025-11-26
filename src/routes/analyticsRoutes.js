import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { analyticsController } from '../controllers/analyticsController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/workspace', analyticsController.getWorkspaceAnalytics);
router.get('/project', analyticsController.getProjectAnalytics);
router.get('/dashboard/:id', analyticsController.getDashboard);

export default router;

import express from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/project/:projectId', analyticsController.getProjectAnalytics);
router.get('/dashboard/:workspaceId', analyticsController.getTeamAnalytics);
router.get('/team', analyticsController.getTeamAnalytics);

export default router;

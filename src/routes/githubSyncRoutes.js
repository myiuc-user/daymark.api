import express from 'express';
import { githubSyncController } from '../controllers/githubSyncController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/sync-issues', githubSyncController.syncIssues);
router.post('/create-issue', githubSyncController.createIssue);
router.post('/update-issue', githubSyncController.updateIssue);

export default router;

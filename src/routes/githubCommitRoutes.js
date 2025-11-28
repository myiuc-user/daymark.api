import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { githubCommitController } from '../controllers/githubCommitController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/project/:projectId', githubCommitController.getProjectCommits);
router.post('/link', githubCommitController.linkTaskToCommit);
router.post('/update-message', githubCommitController.updateCommitMessage);
router.post('/unlink', githubCommitController.unlinkTaskFromCommit);

export default router;

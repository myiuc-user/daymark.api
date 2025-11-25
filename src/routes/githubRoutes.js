import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { githubController } from '../controllers/githubController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/repo-info', githubController.getRepoInfo);
router.get('/code-metrics', githubController.getCodeMetrics);
router.get('/search', githubController.searchRepos);

export default router;

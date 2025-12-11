import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { githubController } from '../controllers/githubController.js';

const router = express.Router();

router.use(authenticateToken);

// Auth endpoints
router.get('/status', githubController.getStatus);
router.get('/auth-url', githubController.getAuthUrl);
router.post('/callback', githubController.handleCallback);
router.delete('/disconnect', githubController.disconnectGithub);

// Repository endpoints
router.get('/user-repos', githubController.getUserRepos);
router.get('/user-orgs', githubController.getUserOrgs);
router.get('/org-repos', githubController.getOrgRepos);
router.get('/repo-info', githubController.getRepoInfo);
router.get('/code-metrics', githubController.getCodeMetrics);
router.get('/search', githubController.searchRepos);

// Commit endpoints
router.get('/commits/:projectId', githubController.getProjectCommits);
router.post('/commits/link', githubController.linkTaskToCommit);
router.post('/commits/update-message', githubController.updateCommitMessage);
router.post('/commits/unlink', githubController.unlinkTaskFromCommit);

// Sync endpoints
router.post('/sync-issues', githubController.syncIssues);
router.post('/create-issue', githubController.createIssue);
router.post('/update-issue', githubController.updateIssue);

export default router;

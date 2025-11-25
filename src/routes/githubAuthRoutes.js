import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { githubAuthController } from '../controllers/githubAuthController.js';

const router = express.Router();

router.get('/auth-url', githubAuthController.getAuthUrl);
router.get('/callback', authenticateToken, githubAuthController.handleCallback);
router.post('/disconnect', authenticateToken, githubAuthController.disconnectGithub);

export default router;

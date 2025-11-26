import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { githubAuthController } from '../controllers/githubAuthController.js';

const router = express.Router();

router.get('/status', authenticateToken, githubAuthController.getStatus);
router.get('/auth-url', authenticateToken, githubAuthController.getAuthUrl);
router.post('/callback', authenticateToken, githubAuthController.handleCallback);
router.delete('/disconnect', authenticateToken, githubAuthController.disconnectGithub);

export default router;

import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, loginSchema } from '../utils/validation.js';
import { sensitiveRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', sensitiveRateLimiter, validateRequest(loginSchema), authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.post('/refresh', sensitiveRateLimiter, authController.refresh);
router.post('/logout', authenticateToken, authController.logout);

export default router;

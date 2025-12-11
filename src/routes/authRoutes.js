import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, loginSchema } from '../utils/validation.js';

const router = express.Router();

router.post('/login', validateRequest(loginSchema), authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.post('/logout', authenticateToken, authController.logout);

export default router;

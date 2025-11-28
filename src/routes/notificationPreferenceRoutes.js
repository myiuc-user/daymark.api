import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { notificationPreferenceController } from '../controllers/notificationPreferenceController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', notificationPreferenceController.getPreferences);
router.put('/', notificationPreferenceController.updatePreferences);

export default router;

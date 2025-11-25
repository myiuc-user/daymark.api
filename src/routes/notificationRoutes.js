import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { notificationController } from '../controllers/notificationController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;

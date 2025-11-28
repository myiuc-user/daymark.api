import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { taskHistoryController } from '../controllers/taskHistoryController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:taskId', taskHistoryController.getTaskHistory);

export default router;

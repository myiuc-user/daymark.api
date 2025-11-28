import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { recurringTaskController } from '../controllers/recurringTaskController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/projects/:projectId/recurring', recurringTaskController.createRecurringTask);
router.get('/projects/:projectId/recurring', recurringTaskController.getRecurringTasks);
router.put('/recurring/:id', recurringTaskController.updateRecurringTask);
router.delete('/recurring/:id', recurringTaskController.deleteRecurringTask);

export default router;

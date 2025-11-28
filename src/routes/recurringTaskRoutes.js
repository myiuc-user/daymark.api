import express from 'express';
import { recurringTaskController } from '../controllers/recurringTaskController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', recurringTaskController.createRecurringTask);
router.get('/', recurringTaskController.getRecurringTasks);
router.put('/:id', recurringTaskController.updateRecurringTask);
router.delete('/:id', recurringTaskController.deleteRecurringTask);

export default router;

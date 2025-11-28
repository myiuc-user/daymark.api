import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { taskDependencyController } from '../controllers/taskDependencyController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/:taskId/dependencies', taskDependencyController.addDependency);
router.delete('/:taskId/dependencies/:dependsOnId', taskDependencyController.removeDependency);
router.get('/:taskId/dependencies', taskDependencyController.getTaskDependencies);
router.get('/:taskId/blocking', taskDependencyController.getBlockingTasks);

export default router;

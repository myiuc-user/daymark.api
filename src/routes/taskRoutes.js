import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { taskController } from '../controllers/taskController.js';

const router = express.Router();

router.use(authenticateToken);

// Non-parameterized routes first
router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.post('/recurring', taskController.createRecurringTask);
router.get('/recurring', taskController.getRecurringTasks);

// Parameterized routes
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Comments
router.get('/:id/comments', taskController.getComments);
router.post('/:id/comments', taskController.addComment);

// Watchers
router.get('/:id/watchers', taskController.getWatchers);
router.post('/:id/watchers', taskController.addWatcher);
router.delete('/:id/watchers/:userId', taskController.removeWatcher);

// Subtasks
router.get('/:id/subtasks', taskController.getSubtasks);
router.post('/:id/subtasks', taskController.createSubtask);
router.patch('/:id/subtasks/toggle-status', taskController.toggleSubtaskStatus);

// Status
router.patch('/:id/status', taskController.updateTaskStatus);

// Favorites & Archive
router.patch('/:id/favorite', taskController.toggleFavorite);
router.patch('/:id/archive', taskController.toggleArchive);

// Dependencies
router.post('/:taskId/dependencies', taskController.addDependency);
router.delete('/:taskId/dependencies/:dependsOnId', taskController.removeDependency);
router.get('/:taskId/dependencies', taskController.getTaskDependencies);
router.get('/:taskId/blocking', taskController.getBlockingTasks);

// History
router.get('/:taskId/history', taskController.getTaskHistory);

// Recurring Tasks (parameterized)
router.put('/recurring/:id', taskController.updateRecurringTask);
router.delete('/recurring/:id', taskController.deleteRecurringTask);

export default router;

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { taskController } from '../controllers/taskController.js';

const router = express.Router();

router.use(authenticateToken);

// Main CRUD routes
router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Comments nested routes
router.get('/:id/comments', taskController.getComments);
router.post('/:id/comments', taskController.addComment);

// Watchers nested routes
router.get('/:id/watchers', taskController.getWatchers);
router.post('/:id/watchers', taskController.addWatcher);
router.delete('/:id/watchers/:userId', taskController.removeWatcher);

// Subtasks nested routes
router.get('/:id/subtasks', taskController.getSubtasks);
router.post('/:id/subtasks', taskController.createSubtask);
router.patch('/:id/subtasks/toggle-status', taskController.toggleSubtaskStatus);

// Task status
router.patch('/:id/status', taskController.updateTaskStatus);

// Favorite and Archive routes
router.patch('/:id/favorite', taskController.toggleFavorite);
router.patch('/:id/archive', taskController.toggleArchive);

export default router;

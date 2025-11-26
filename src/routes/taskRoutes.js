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

export default router;

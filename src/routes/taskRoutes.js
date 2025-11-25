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

// Comments route
router.post('/:id/comments', taskController.addComment);

export default router;

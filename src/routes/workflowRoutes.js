import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { workflowController } from '../controllers/workflowController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', workflowController.getWorkflows);
router.post('/', workflowController.createWorkflow);
router.put('/:id', workflowController.updateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

export default router;

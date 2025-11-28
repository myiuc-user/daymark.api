import express from 'express';
import { workflowController } from '../controllers/workflowController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', workflowController.createWorkflowState);
router.get('/', workflowController.getWorkflowStates);
router.put('/:id', workflowController.updateWorkflowState);
router.delete('/:id', workflowController.deleteWorkflowState);

export default router;

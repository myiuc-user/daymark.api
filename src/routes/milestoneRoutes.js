import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { milestoneController } from '../controllers/milestoneController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', milestoneController.getMilestones);
router.post('/', milestoneController.createMilestone);
router.put('/:id', milestoneController.updateMilestone);
router.delete('/:id', milestoneController.deleteMilestone);

export default router;

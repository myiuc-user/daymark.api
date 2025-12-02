import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { sprintController } from '../controllers/sprintController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', sprintController.getSprints);
router.post('/', sprintController.createSprint);
router.put('/:id', sprintController.updateSprint);
router.put('/:id/activate', sprintController.activateSprint);
router.delete('/:id', sprintController.deleteSprint);

export default router;

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { teamController } from '../controllers/teamController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', teamController.getTeams);
router.post('/', teamController.createTeam);
router.get('/:id', teamController.getTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

export default router;

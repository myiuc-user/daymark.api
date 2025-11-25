import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { invitationController } from '../controllers/invitationController.js';

const router = express.Router();

router.use(authenticateToken);

router.delete('/:id', invitationController.cancelInvitation);

export default router;

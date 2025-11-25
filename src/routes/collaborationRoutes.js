import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { collaborationController } from '../controllers/collaborationController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', collaborationController.getCollaborations);
router.post('/', collaborationController.createCollaboration);
router.delete('/:id', collaborationController.deleteCollaboration);

export default router;

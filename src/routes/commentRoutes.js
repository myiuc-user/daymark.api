import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { commentController } from '../controllers/commentController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:commentId', commentController.getComment);
router.put('/:commentId', commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);

export default router;

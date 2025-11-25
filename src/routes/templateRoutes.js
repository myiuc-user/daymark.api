import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { templateController } from '../controllers/templateController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', templateController.getTemplates);
router.post('/', templateController.createTemplate);
router.delete('/:id', templateController.deleteTemplate);

export default router;

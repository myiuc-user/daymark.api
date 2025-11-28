import express from 'express';
import { templateController } from '../controllers/templateController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', templateController.createTemplate);
router.get('/', templateController.getTemplates);
router.post('/use', templateController.useTemplate);
router.delete('/:id', templateController.deleteTemplate);

export default router;

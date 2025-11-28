import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { dataExportController } from '../controllers/dataExportController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/export', dataExportController.exportData);
router.post('/import', dataExportController.importData);

export default router;

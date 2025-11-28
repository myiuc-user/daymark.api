import express from 'express';
import { timeTrackingController } from '../controllers/timeTrackingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', timeTrackingController.logTime);
router.get('/', timeTrackingController.getTimeEntries);
router.get('/summary', timeTrackingController.getSummary);
router.delete('/:id', timeTrackingController.deleteTimeEntry);

export default router;

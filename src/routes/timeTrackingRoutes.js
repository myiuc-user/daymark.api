import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { timeTrackingController } from '../controllers/timeTrackingController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', timeTrackingController.getTimeEntries);
router.post('/', timeTrackingController.createTimeEntry);
router.delete('/:id', timeTrackingController.deleteTimeEntry);

export default router;

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { delegationController } from '../controllers/delegationController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', delegationController.delegate);
router.get('/', delegationController.getDelegations);
router.get('/my-delegations', delegationController.getMyDelegations);
router.delete('/:id', delegationController.revoke);

export default router;

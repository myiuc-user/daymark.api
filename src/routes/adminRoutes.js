import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';
import { adminController } from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticateToken, requireSuperAdmin);

router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

export default router;

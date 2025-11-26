import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { userController } from '../controllers/userController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUser);
router.put('/profile', userController.updateProfile);
router.put('/password', userController.updatePassword);

export default router;

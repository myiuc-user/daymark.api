import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { fileController } from '../controllers/fileController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticateToken);

router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/list/project/:projectId', fileController.listProjectFiles);
router.delete('/:id', fileController.deleteFile);

export default router;

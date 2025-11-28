import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, createProjectSchema } from '../utils/validation.js';
import { projectController } from '../controllers/projectController.js';

const router = express.Router();

router.use(authenticateToken);

// Main CRUD routes
router.get('/', projectController.getProjects);
router.post('/', validateRequest(createProjectSchema), projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', validateRequest(createProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Members routes
router.get('/:id/members', projectController.getMembers);
router.post('/:id/members', projectController.addMember);
router.delete('/:id/members/:userId', projectController.removeMember);
router.put('/:id/members/:userId/permissions', projectController.updateMemberPermissions);

// GitHub routes
router.post('/:id/github', projectController.connectGithub);
router.post('/:id/connect-github', projectController.connectGithub);
router.delete('/:id/github', projectController.disconnectGithub);
router.post('/:id/github/sync', projectController.syncGithub);

export default router;

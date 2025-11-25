import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, createWorkspaceSchema } from '../utils/validation.js';
import { workspaceController } from '../controllers/workspaceController.js';

const router = express.Router();

router.use(authenticateToken);

// Routes without :id parameter (must be before /:id routes)
router.get('/invitation/:token', workspaceController.getInvitationDetails);
router.post('/accept-invitation/:token', workspaceController.acceptInvitation);

// Main CRUD routes
router.get('/', workspaceController.getWorkspaces);
router.post('/', validateRequest(createWorkspaceSchema), workspaceController.createWorkspace);
router.get('/:id', workspaceController.getWorkspace);
router.put('/:id', validateRequest(createWorkspaceSchema), workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

// Members routes
router.get('/:id/members', workspaceController.getMembers);
router.put('/:id/members/:userId/role', workspaceController.updateMemberRole);
router.delete('/:id/members/:userId', workspaceController.removeMember);

// Invitations routes
router.get('/:id/invitations', workspaceController.getInvitations);
router.post('/:id/invitations', workspaceController.sendInvitations);

export default router;

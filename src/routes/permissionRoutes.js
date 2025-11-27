import express from 'express';
import { permissionController } from '../controllers/permissionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkProjectPermission, checkWorkspacePermission } from '../middleware/permissionMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user permissions in project
router.get('/project/:projectId', permissionController.getProjectPermissions);

// Get user permissions in workspace
router.get('/workspace/:workspaceId', permissionController.getWorkspacePermissions);

// Get user role in project
router.get('/project/:projectId/role', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { permissionService } = await import('../services/permissionService.js');
    const role = await permissionService.getProjectRole(userId, projectId);
    res.json({ role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user role in workspace
router.get('/workspace/:workspaceId/role', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const { permissionService } = await import('../services/permissionService.js');
    const role = await permissionService.getWorkspaceRole(userId, workspaceId);
    res.json({ role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check specific permission
router.post('/check-permission', permissionController.checkPermission);

// Get all project members with permissions
router.get(
  '/projects/:projectId/members-permissions',
  checkProjectPermission(PERMISSIONS.PROJECT.MANAGE_MEMBERS),
  permissionController.getProjectMembersPermissions
);

// Update project member role
router.put(
  '/projects/:projectId/members/:memberId/role',
  checkProjectPermission(PERMISSIONS.PROJECT.MANAGE_MEMBERS),
  permissionController.updateProjectMemberRole
);

// Update workspace member role
router.put(
  '/workspaces/:workspaceId/members/:memberId/role',
  checkWorkspacePermission(PERMISSIONS.WORKSPACE.MANAGE_ROLES),
  permissionController.updateWorkspaceMemberRole
);

export default router;

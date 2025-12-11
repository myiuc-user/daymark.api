import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { userController } from '../controllers/userController.js';
import { uploadProfilePhoto } from '../config/multer.js';
import { checkProjectPermission, checkWorkspacePermission } from '../middleware/permissionMiddleware.js';
import { PERMISSIONS } from '../utils/permissionHelpers.js';

const router = express.Router();

router.use(authenticateToken);

// Non-parameterized routes first
router.get('/search', userController.searchUsers);
router.get('/export', userController.exportData);
router.post('/import', userController.importData);
router.post('/permissions/check-permission', userController.checkPermission);

// Permission routes
router.get('/permissions/project/:projectId', userController.getProjectPermissions);
router.get('/permissions/workspace/:workspaceId', userController.getWorkspacePermissions);
router.get('/permissions/project/:projectId/role', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const role = await userController.userService?.getProjectRole(userId, projectId);
    res.json({ role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/permissions/workspace/:workspaceId/role', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const role = await userController.userService?.getWorkspaceRole(userId, workspaceId);
    res.json({ role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get(
  '/permissions/projects/:projectId/members-permissions',
  checkProjectPermission(PERMISSIONS.PROJECT.MANAGE_MEMBERS),
  userController.getProjectMembersPermissions
);

router.put(
  '/permissions/projects/:projectId/members/:memberId/role',
  checkProjectPermission(PERMISSIONS.PROJECT.MANAGE_MEMBERS),
  userController.updateProjectMemberRole
);

router.put(
  '/permissions/workspaces/:workspaceId/members/:memberId/role',
  checkWorkspacePermission(PERMISSIONS.WORKSPACE.MANAGE_ROLES),
  userController.updateWorkspaceMemberRole
);

// Parameterized routes
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateProfile);
router.put('/:id/password', userController.updatePassword);
router.post('/:id/profile-photo', uploadProfilePhoto.single('profilePhoto'), userController.uploadProfilePhoto);

export default router;

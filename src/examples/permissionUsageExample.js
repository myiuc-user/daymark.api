// Example: How to use granular permissions in controllers

import { checkPermission, checkProjectPermission, checkWorkspacePermission } from '../middleware/permissionMiddleware.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { permissionService } from '../services/permissionService.js';

// Example 1: Global permission check (Super Admin only)
// router.post('/admin/users', checkPermission(PERMISSIONS.WORKSPACE.MANAGE_ROLES), adminController.createUser);

// Example 2: Project-level permission check
// router.post('/projects/:projectId/tasks', 
//   checkProjectPermission(PERMISSIONS.TASK.CREATE), 
//   taskController.createTask
// );

// Example 3: Workspace-level permission check
// router.put('/workspaces/:workspaceId', 
//   checkWorkspacePermission(PERMISSIONS.WORKSPACE.UPDATE), 
//   workspaceController.updateWorkspace
// );

// Example 4: Manual permission check in controller
export const exampleController = {
  updateTask: async (req, res) => {
    try {
      const { projectId, taskId } = req.params;
      const userId = req.user.id;

      // Check if user has permission to update tasks in this project
      const hasPermission = await permissionService.hasProjectPermission(
        userId,
        projectId,
        PERMISSIONS.TASK.UPDATE
      );

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Proceed with update
      // ...
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTaskPermissions: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Get all permissions user has in this project
      const permissions = await permissionService.getProjectPermissions(userId, projectId);

      res.json({ permissions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  checkMultipleActions: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // Check if user can perform multiple actions
      const canCreateAndAssign = await permissionService.hasAllPermissions(
        userId,
        projectId,
        [PERMISSIONS.TASK.CREATE, PERMISSIONS.TASK.ASSIGN]
      );

      res.json({ canCreateAndAssign });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

// Permission constants for easy reference
export const PERMISSION_EXAMPLES = {
  // Workspace permissions
  MANAGE_WORKSPACE: PERMISSIONS.WORKSPACE.MANAGE_MEMBERS,
  UPDATE_WORKSPACE: PERMISSIONS.WORKSPACE.UPDATE,

  // Project permissions
  CREATE_PROJECT: PERMISSIONS.PROJECT.CREATE,
  MANAGE_PROJECT: PERMISSIONS.PROJECT.MANAGE_SETTINGS,

  // Task permissions
  CREATE_TASK: PERMISSIONS.TASK.CREATE,
  ASSIGN_TASK: PERMISSIONS.TASK.ASSIGN,
  DELETE_TASK: PERMISSIONS.TASK.DELETE,

  // Sprint permissions
  MANAGE_SPRINT: PERMISSIONS.SPRINT.ACTIVATE
};

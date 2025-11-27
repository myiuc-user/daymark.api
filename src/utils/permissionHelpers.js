import { permissionService } from '../services/permissionService.js';
import { PERMISSIONS } from './permissions.js';

// Helper to check permission and throw error if not allowed
export const requirePermission = async (userId, projectId, permission) => {
  const hasPermission = await permissionService.hasProjectPermission(
    userId,
    projectId,
    permission
  );

  if (!hasPermission) {
    const error = new Error('Insufficient permissions');
    error.status = 403;
    throw error;
  }
};

// Helper to check workspace permission
export const requireWorkspacePermission = async (userId, workspaceId, permission) => {
  const hasPermission = await permissionService.hasWorkspacePermission(
    userId,
    workspaceId,
    permission
  );

  if (!hasPermission) {
    const error = new Error('Insufficient permissions');
    error.status = 403;
    throw error;
  }
};

// Helper to filter resources based on permissions
export const filterByPermission = async (userId, projectId, resources, permission) => {
  const hasPermission = await permissionService.hasProjectPermission(
    userId,
    projectId,
    permission
  );

  return hasPermission ? resources : [];
};

// Helper to check if user can perform action on resource
export const canUserPerformAction = async (userId, projectId, action) => {
  const permissionMap = {
    'create_task': PERMISSIONS.TASK.CREATE,
    'update_task': PERMISSIONS.TASK.UPDATE,
    'delete_task': PERMISSIONS.TASK.DELETE,
    'assign_task': PERMISSIONS.TASK.ASSIGN,
    'comment_task': PERMISSIONS.TASK.COMMENT,
    'create_sprint': PERMISSIONS.SPRINT.CREATE,
    'update_sprint': PERMISSIONS.SPRINT.UPDATE,
    'delete_sprint': PERMISSIONS.SPRINT.DELETE,
    'activate_sprint': PERMISSIONS.SPRINT.ACTIVATE,
    'manage_project': PERMISSIONS.PROJECT.MANAGE_SETTINGS,
    'manage_members': PERMISSIONS.PROJECT.MANAGE_MEMBERS
  };

  const permission = permissionMap[action];
  if (!permission) return false;

  return await permissionService.hasProjectPermission(userId, projectId, permission);
};

// Helper to get user's effective role considering super admin
export const getUserEffectiveRole = async (userId, projectId) => {
  const role = await permissionService.getProjectRole(userId, projectId);
  return role || 'VIEWER';
};

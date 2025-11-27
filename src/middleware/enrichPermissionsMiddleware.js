import { permissionService } from '../services/permissionService.js';

// Enrich request with user's permissions for a project
export const enrichProjectPermissions = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId || !projectId) {
      return next();
    }

    const permissions = await permissionService.getProjectPermissions(userId, projectId);
    const role = await permissionService.getProjectRole(userId, projectId);

    req.userPermissions = {
      projectId,
      role,
      permissions,
      can: (permission) => permissions.includes(permission)
    };

    next();
  } catch (error) {
    next();
  }
};

// Enrich request with user's permissions for a workspace
export const enrichWorkspacePermissions = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.id;

    if (!userId || !workspaceId) {
      return next();
    }

    const permissions = await permissionService.getWorkspacePermissions(userId, workspaceId);
    const role = await permissionService.getWorkspaceRole(userId, workspaceId);

    req.userPermissions = {
      workspaceId,
      role,
      permissions,
      can: (permission) => permissions.includes(permission)
    };

    next();
  } catch (error) {
    next();
  }
};

// Enrich request with global user permissions
export const enrichGlobalPermissions = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return next();
    }

    const { ROLE_PERMISSIONS } = await import('../utils/permissions.js');
    const permissions = ROLE_PERMISSIONS[user.role] || [];

    req.userPermissions = {
      role: user.role,
      permissions,
      can: (permission) => permissions.includes(permission)
    };

    next();
  } catch (error) {
    next();
  }
};

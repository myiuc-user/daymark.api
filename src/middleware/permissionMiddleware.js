import { hasPermission, hasRoleOrHigher, ROLE_PERMISSIONS } from '../utils/permissionHelpers.js';
import prisma from '../config/prisma.js';

// Check global permission
export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!hasPermission(user.role, requiredPermission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Check project permission
export const checkProjectPermission = (requiredRole = 'MEMBER') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      const projectId = req.params.id || req.params.projectId || req.body.projectId;
      const userId = req.user.id;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID required' });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          workspace: {
            include: {
              members: {
                where: { userId },
                include: { user: true }
              }
            }
          },
          members: {
            where: { userId },
            include: { user: true }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.workspace.ownerId === userId || project.team_lead === userId) {
        return next();
      }

      const projectMember = project.members[0];
      const workspaceMember = project.workspace.members[0];

      const projectRole = projectMember?.role || 'VIEWER';
      const workspaceRole = workspaceMember?.role || 'VIEWER';

      const effectiveRole = projectRole >= workspaceRole ? projectRole : workspaceRole;

      if (!hasRoleOrHigher(effectiveRole, requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.projectMember = projectMember;
      req.workspaceMember = workspaceMember;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Check workspace permission
export const checkWorkspacePermission = (requiredRole = 'MEMBER') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId || req.query.workspaceId;
      const userId = req.user.id;

      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID required' });
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          members: {
            where: { userId },
            include: { user: true }
          }
        }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      if (workspace.ownerId === userId) {
        return next();
      }

      const workspaceMember = workspace.members[0];
      if (!workspaceMember) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!hasRoleOrHigher(workspaceMember.role, requiredRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.workspaceMember = workspaceMember;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Check multiple permissions
export const checkMultiplePermissions = (permissions, requireAll = false) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const checker = requireAll ? 
        (role, perms) => perms.every(p => hasPermission(role, p)) :
        (role, perms) => perms.some(p => hasPermission(role, p));

      if (!checker(user.role, permissions)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Enrich request with global permissions
export const enrichGlobalPermissions = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return next();
    }

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

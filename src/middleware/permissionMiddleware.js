import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/permissions.js';
import prisma from '../config/prisma.js';

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

export const checkProjectPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { projectId } = req.params || req.body;

      if (!user || !projectId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Super admin has all permissions
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check project membership and role
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id
          }
        }
      });

      if (!projectMember) {
        return res.status(403).json({ error: 'Not a project member' });
      }

      if (!hasPermission(projectMember.role, requiredPermission)) {
        return res.status(403).json({ error: 'Insufficient project permissions' });
      }

      req.projectMember = projectMember;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

export const checkWorkspacePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { workspaceId } = req.params || req.body;

      if (!user || !workspaceId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Super admin has all permissions
      if (user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Check workspace membership and role
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: user.id
          }
        }
      });

      if (!workspaceMember) {
        return res.status(403).json({ error: 'Not a workspace member' });
      }

      if (!hasPermission(workspaceMember.role, requiredPermission)) {
        return res.status(403).json({ error: 'Insufficient workspace permissions' });
      }

      req.workspaceMember = workspaceMember;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

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

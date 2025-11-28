import prisma from '../config/prisma.js';
import { hasRoleOrHigher } from '../utils/permissions.js';

export const checkProjectPermission = (requiredRole = 'MEMBER') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      const { id: projectId } = req.params;
      const userId = req.user.id;

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

export const checkWorkspacePermission = (requiredRole = 'MEMBER') => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      const { workspaceId } = req.query || req.body;
      const userId = req.user.id;

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

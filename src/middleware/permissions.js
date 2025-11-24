import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const checkProjectPermission = (requiredRole = 'MEMBER') => {
  return async (req, res, next) => {
    try {
      const { id: projectId } = req.params;
      const userId = req.user.id;

      // Check if user is project owner
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          workspace: true,
          members: {
            where: { userId },
            include: { user: true }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Super admin can do anything
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Workspace owner can do anything
      if (project.workspace.ownerId === userId) {
        return next();
      }

      // Project team lead can do anything
      if (project.team_lead === userId) {
        return next();
      }

      // Check project member role
      const projectMember = project.members[0];
      if (!projectMember) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const roleHierarchy = {
        'VIEWER': 1,
        'MEMBER': 2,
        'ADMIN': 3
      };

      if (roleHierarchy[projectMember.role] < roleHierarchy[requiredRole]) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.projectMember = projectMember;
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

      // Super admin can do anything
      if (req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // Workspace owner can do anything
      if (workspace.ownerId === userId) {
        return next();
      }

      // Check workspace member role
      const workspaceMember = workspace.members[0];
      if (!workspaceMember) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const roleHierarchy = {
        'MEMBER': 1,
        'ADMIN': 2
      };

      if (roleHierarchy[workspaceMember.role] < roleHierarchy[requiredRole]) {
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
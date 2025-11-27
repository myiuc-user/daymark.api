import { permissionService } from '../services/permissionService.js';
import { PERMISSIONS } from '../utils/permissions.js';
import prisma from '../config/prisma.js';

export const permissionController = {
  // Get user permissions in project
  getProjectPermissions: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const permissions = await permissionService.getProjectPermissions(userId, projectId);
      const role = await permissionService.getProjectRole(userId, projectId);

      res.json({ role, permissions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get user permissions in workspace
  getWorkspacePermissions: async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.id;

      const permissions = await permissionService.getWorkspacePermissions(userId, workspaceId);
      const role = await permissionService.getWorkspaceRole(userId, workspaceId);

      res.json({ role, permissions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Check specific permission
  checkPermission: async (req, res) => {
    try {
      const { projectId, permission } = req.body;
      const userId = req.user.id;

      const hasPermission = await permissionService.hasProjectPermission(
        userId,
        projectId,
        permission
      );

      res.json({ hasPermission });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all project members with their roles and permissions
  getProjectMembersPermissions: async (req, res) => {
    try {
      const { projectId } = req.params;

      const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      });

      const membersWithPermissions = members.map(member => ({
        ...member,
        permissions: permissionService.getProjectPermissions(member.userId, projectId)
      }));

      res.json(membersWithPermissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update member role in project
  updateProjectMemberRole: async (req, res) => {
    try {
      const { projectId, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user.id;

      // Check if requester has permission to manage roles
      const hasPermission = await permissionService.hasProjectPermission(
        userId,
        projectId,
        PERMISSIONS.PROJECT.MANAGE_MEMBERS
      );

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const updated = await prisma.projectMember.update({
        where: {
          userId_projectId: {
            projectId,
            userId: memberId
          }
        },
        data: { role },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update member role in workspace
  updateWorkspaceMemberRole: async (req, res) => {
    try {
      const { workspaceId, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user.id;

      // Check if requester has permission to manage roles
      const hasPermission = await permissionService.hasWorkspacePermission(
        userId,
        workspaceId,
        PERMISSIONS.WORKSPACE.MANAGE_ROLES
      );

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const updated = await prisma.workspaceMember.update({
        where: {
          userId_workspaceId: {
            workspaceId,
            userId: memberId
          }
        },
        data: { role },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

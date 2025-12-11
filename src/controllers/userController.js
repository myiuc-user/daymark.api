import { userService } from '../services/userService.js';
import { PERMISSIONS } from '../utils/permissionHelpers.js';
import prisma from '../config/prisma.js';
import path from 'path';

export const userController = {
  searchUsers: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const users = await userService.searchUsers(q);
      res.json({ users });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      if (id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const user = await userService.updateProfile(id, req.body);
      res.json({ user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { id } = req.params;
      if (id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old and new passwords are required' });
      }
      await userService.updatePassword(id, oldPassword, newPassword);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  uploadProfilePhoto: async (req, res) => {
    try {
      const { id } = req.params;
      if (id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const compressedPath = await userService.compressProfilePhoto(req.file.path);
      const fileName = path.basename(compressedPath);
      const protocol = req.protocol;
      const host = req.get('host');
      const photoUrl = `${protocol}://${host}/uploads/profiles/${fileName}`;
      
      const user = await userService.updateProfilePhoto(id, photoUrl);
      res.json({ user, message: 'Profile photo updated successfully' });
    } catch (error) {
      console.error('Upload profile photo error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload photo' });
    }
  },

  exportData: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await userService.exportUserData(userId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="daymark-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(data);
    } catch (error) {
      console.error('Export data error:', error);
      res.status(500).json({ error: error.message || 'Failed to export data' });
    }
  },

  importData: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const importData = req.body;
      if (!importData || !importData.data) {
        return res.status(400).json({ error: 'Invalid import data format' });
      }
      if (userRole === 'SUPER_ADMIN' && importData.user?.role !== 'SUPER_ADMIN') {
        importData.user = importData.user || {};
        importData.user.role = 'SUPER_ADMIN';
      }
      const results = await userService.importUserData(userId, importData);
      res.json({ message: 'Data imported successfully', results });
    } catch (error) {
      console.error('Import data error:', error);
      res.status(400).json({ error: error.message || 'Failed to import data' });
    }
  },

  // Permission endpoints
  getProjectPermissions: async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      const permissions = await userService.getProjectPermissions(userId, projectId);
      const role = await userService.getProjectRole(userId, projectId);

      res.json({ role, permissions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getWorkspacePermissions: async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.id;

      const permissions = await userService.getWorkspacePermissions(userId, workspaceId);
      const role = await userService.getWorkspaceRole(userId, workspaceId);

      res.json({ role, permissions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  checkPermission: async (req, res) => {
    try {
      const { projectId, permission } = req.body;
      const userId = req.user.id;

      const hasPermission = await userService.hasProjectPermission(
        userId,
        projectId,
        permission
      );

      res.json({ hasPermission });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

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
        permissions: userService.getProjectPermissions(member.userId, projectId)
      }));

      res.json(membersWithPermissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateProjectMemberRole: async (req, res) => {
    try {
      const { projectId, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user.id;

      const hasPermission = await userService.hasProjectPermission(
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

  updateWorkspaceMemberRole: async (req, res) => {
    try {
      const { workspaceId, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user.id;

      const hasPermission = await userService.hasWorkspacePermission(
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

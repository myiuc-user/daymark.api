import prisma from '../config/prisma.js';
import { workspaceService } from '../services/workspaceService.js';
import { hasRoleOrHigher } from '../utils/permissions.js';

export const workspaceController = {
  getWorkspaces: async (req, res) => {
    try {
      const workspaces = await workspaceService.getUserWorkspaces(req.user.id);
      res.json({ workspaces });
    } catch (error) {
      console.error('Get workspaces error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createWorkspace: async (req, res) => {
    try {
      const { name, description, slug } = req.body;
      const workspace = await workspaceService.createWorkspace({
        name,
        description,
        slug,
        ownerId: req.user.id
      });
      res.status(201).json({ workspace });
    } catch (error) {
      console.error('Create workspace error:', error);
      if (error.message === 'Workspace slug already exists') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getWorkspace: async (req, res) => {
    try {
      const { id } = req.params;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      const workspace = await workspaceService.getWorkspaceById(id);
      
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const hasAccess = isSuperAdmin || workspace.ownerId === req.user.id || 
        workspace.members.some(member => member.userId === req.user.id);

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ workspace });
    } catch (error) {
      console.error('Get workspace error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateWorkspace: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, slug } = req.body;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      const workspace = await workspaceService.getWorkspaceById(id, { select: { ownerId: true } });
      
      if (!workspace || (!isSuperAdmin && workspace.ownerId !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedWorkspace = await workspaceService.updateWorkspace(id, {
        name,
        description,
        slug
      });

      res.json({ workspace: updatedWorkspace });
    } catch (error) {
      console.error('Update workspace error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteWorkspace: async (req, res) => {
    try {
      const { id } = req.params;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      const workspace = await workspaceService.getWorkspaceById(id, { select: { ownerId: true } });
      
      if (!workspace || (!isSuperAdmin && workspace.ownerId !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await workspaceService.deleteWorkspace(id);
      res.json({ message: 'Workspace deleted successfully' });
    } catch (error) {
      console.error('Delete workspace error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getMembers: async (req, res) => {
    try {
      const { id } = req.params;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      const workspace = await prisma.workspace.findUnique({
        where: { id },
        select: { ownerId: true, members: { select: { userId: true } } }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const hasAccess = isSuperAdmin || workspace.ownerId === req.user.id || 
        workspace.members.some(member => member.userId === req.user.id);

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const members = await workspaceService.getMembers(id);
      res.json({ members });
    } catch (error) {
      console.error('Get workspace members error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getInvitations: async (req, res) => {
    try {
      const { id } = req.params;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
          members: {
            where: { userId: req.user.id },
            select: { role: true }
          }
        }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const isOwner = workspace.ownerId === req.user.id;
      const userMember = workspace.members[0];
      const isAdmin = userMember && hasRoleOrHigher(userMember.role, 'ADMIN');

      if (!isSuperAdmin && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const invitations = await workspaceService.getInvitations(id);
      res.json({ invitations });
    } catch (error) {
      console.error('Get workspace invitations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  sendInvitations: async (req, res) => {
    try {
      const { id } = req.params;
      const { invitations } = req.body;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
          members: {
            where: { userId: req.user.id },
            select: { role: true }
          }
        }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const isOwner = workspace.ownerId === req.user.id;
      const userMember = workspace.members[0];
      const isAdmin = userMember && hasRoleOrHigher(userMember.role, 'ADMIN');

      if (!isSuperAdmin && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only workspace owners and admins can invite members' });
      }

      const results = await workspaceService.sendInvitations(id, invitations, req.user.id, workspace.name);
      res.json({ message: 'Invitations sent successfully', invitations: results });
    } catch (error) {
      console.error('Send invitations error:', error);
      if (error.message.includes('Invalid role')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to send invitations' });
    }
  },

  getInvitationDetails: async (req, res) => {
    try {
      const { token } = req.params;
      const invitation = await workspaceService.getInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({ error: 'Invalid invitation token' });
      }

      if (invitation.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invitation has expired' });
      }

      if (invitation.acceptedAt) {
        return res.status(400).json({ error: 'Invitation already accepted' });
      }

      res.json({ invitation });
    } catch (error) {
      console.error('Get invitation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  acceptInvitation: async (req, res) => {
    try {
      const { token } = req.params;
      const { name, password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const result = await workspaceService.acceptInvitation(token, name, password);
      res.json({ 
        message: 'Invitation accepted successfully',
        workspace: result.workspace
      });
    } catch (error) {
      console.error('Accept invitation error:', error);
      if (error.message.includes('expired')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to accept invitation' });
    }
  },

  updateMemberRole: async (req, res) => {
    try {
      const { id, userId } = req.params;
      const { role } = req.body;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
          members: {
            where: { userId: req.user.id },
            select: { role: true }
          }
        }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const isOwner = workspace.ownerId === req.user.id;
      const userMember = workspace.members[0];
      const isAdmin = userMember && hasRoleOrHigher(userMember.role, 'ADMIN');

      if (!isSuperAdmin && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const member = await workspaceService.updateMemberRole(id, userId, role);
      res.json({ member });
    } catch (error) {
      console.error('Update member role error:', error);
      if (error.message.includes('Invalid role')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update member role' });
    }
  },

  removeMember: async (req, res) => {
    try {
      const { id, userId } = req.params;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
          members: {
            where: { userId: req.user.id },
            select: { role: true }
          }
        }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      const isOwner = workspace.ownerId === req.user.id;
      const userMember = workspace.members[0];
      const isAdmin = userMember && hasRoleOrHigher(userMember.role, 'ADMIN');

      if (!isSuperAdmin && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (workspace.ownerId === userId) {
        return res.status(400).json({ error: 'Cannot remove workspace owner' });
      }

      await workspaceService.removeMember(id, userId);
      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  }
};

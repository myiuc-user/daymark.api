import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';

import { validateRequest, createWorkspaceSchema } from '../utils/validation.js';
import { sendInvitationEmail } from '../services/emailService.js';
import crypto from 'crypto';

const router = express.Router();

// All workspace routes require authentication
router.use(authenticateToken);

// Get user workspaces
router.get('/', async (req, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          {
            members: {
              some: { userId: req.user.id }
            }
          }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        projects: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ workspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create workspace
router.post('/', validateRequest(createWorkspaceSchema), async (req, res) => {
  try {
    const { name, description, slug } = req.body;

    // Check if slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug }
    });

    if (existingWorkspace) {
      return res.status(400).json({ error: 'Workspace slug already exists' });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        slug,
        ownerId: req.user.id
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({ workspace });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get workspace details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        },
        projects: {
          include: {
            owner: {
              select: { id: true, name: true }
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user has access
    const hasAccess = workspace.ownerId === req.user.id || 
      workspace.members.some(member => member.userId === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ workspace });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update workspace
router.put('/:id', validateRequest(createWorkspaceSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, slug } = req.body;

    // Check ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!workspace || workspace.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: { name, description, slug },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({ workspace: updatedWorkspace });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete workspace
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!workspace || workspace.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.workspace.delete({
      where: { id }
    });

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get workspace members
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if workspace exists and user has access
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { ownerId: true, members: { select: { userId: true } } }
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const hasAccess = workspace.ownerId === req.user.id || 
      workspace.members.some(member => member.userId === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get members with user details
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    res.json({ members });
  } catch (error) {
    console.error('Get workspace members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get workspace invitations
router.get('/:id/invitations', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is workspace owner or admin
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
    const isAdmin = workspace.members.some(m => m.role === 'ADMIN');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        workspaceId: id,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invitations });
  } catch (error) {
    console.error('Get workspace invitations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invitation details
router.get('/invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    });

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
});

// Accept workspace invitation
router.post('/accept-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    // Find invitation
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ error: 'Invitation already accepted' });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    // Create user if doesn't exist
    if (!user) {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      user = await prisma.user.create({
        data: {
          name,
          email: invitation.email,
          password: hashedPassword
        }
      });
    }

    // Add user to workspace
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role
      }
    });

    // Mark invitation as accepted
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });

    res.json({ 
      message: 'Invitation accepted successfully',
      workspace: invitation.workspace
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Send invitations to workspace
router.post('/:id/invitations', async (req, res) => {
  try {
    const { id } = req.params;
    const { invitations } = req.body;

    // Check if user is workspace owner or admin
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
    const isAdmin = workspace.members.some(m => m.role === 'ADMIN');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only workspace owners and admins can invite members' });
    }

    const results = [];
    for (const invitation of invitations) {
      const { email, role } = invitation;
      
      // Generate invitation token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const newInvitation = await prisma.workspaceInvitation.create({
        data: {
          email,
          role: role === 'org:admin' ? 'ADMIN' : 'MEMBER',
          token: inviteToken,
          expiresAt,
          workspaceId: id,
          invitedById: req.user.id
        }
      });

      // Send invitation email
      const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`;
      await sendInvitationEmail(email, workspace.name, inviteLink);
      
      results.push(newInvitation);
    }

    res.json({ message: 'Invitations sent successfully', invitations: results });
  } catch (error) {
    console.error('Send invitations error:', error);
    res.status(500).json({ error: 'Failed to send invitations' });
  }
});

// Update member role
router.put('/:id/members/:userId/role', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    // Check if user is workspace owner or admin
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
    const isAdmin = workspace.members.some(m => m.role === 'ADMIN');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: id
        }
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    res.json({ member: updatedMember });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Remove member from workspace
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Check if user is workspace owner or admin
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
    const isAdmin = workspace.members.some(m => m.role === 'ADMIN');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Cannot remove workspace owner
    if (workspace.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove workspace owner' });
    }

    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: id
        }
      }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Invite member to workspace (legacy endpoint)
router.post('/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    // Check if user is workspace owner or admin
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
    const isAdmin = workspace.members.some(m => m.role === 'ADMIN');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only workspace owners and admins can invite members' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    
    // Check if already a member
    if (user) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: id
          }
        }
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member of this workspace' });
      }
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        email,
        role: role === 'org:admin' ? 'ADMIN' : 'MEMBER',
        token: inviteToken,
        expiresAt,
        workspaceId: id,
        invitedById: req.user.id
      }
    });

    // Send invitation email
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`;
    await sendInvitationEmail(email, workspace.name, inviteLink);

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Cancel invitation (alternative route)
router.delete('/invitations/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
      include: { workspace: true }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Check if user is workspace owner or admin
    const workspace = await prisma.workspace.findUnique({
      where: { id: invitation.workspaceId },
      include: {
        members: {
          where: { userId: req.user.id },
          select: { role: true }
        }
      }
    });

    const isOwner = workspace.ownerId === req.user.id;
    const isAdmin = workspace.members.some(m => m.role === 'ADMIN');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.workspaceInvitation.delete({
      where: { id: invitationId }
    });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

export default router;

// Create a separate router for invitation endpoints
export const invitationRouter = express.Router();

// Cancel invitation by ID
invitationRouter.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id },
      include: { workspace: true }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Check if user is workspace owner or admin
    const workspace = await prisma.workspace.findUnique({
      where: { id: invitation.workspaceId },
      include: {
        members: {
          where: { userId: req.user.id },
          select: { role: true }
        }
      }
    });

    const isOwner = workspace.ownerId === req.user.id;
    const isAdmin = workspace.members.some(m => m.role === 'ADMIN');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.workspaceInvitation.delete({
      where: { id }
    });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendInvitationEmail } from './emailService.js';

export const workspaceService = {
  getUserWorkspaces: async (userId) => {
    return await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId }
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
  },

  createWorkspace: async (data) => {
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug: data.slug }
    });

    if (existingWorkspace) {
      throw new Error('Workspace slug already exists');
    }

    return await prisma.workspace.create({
      data,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  getWorkspaceById: async (id, options = {}) => {
    if (options.select) {
      return await prisma.workspace.findUnique({
        where: { id },
        select: options.select
      });
    }

    const defaultInclude = {
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
    };

    return await prisma.workspace.findUnique({
      where: { id },
      include: options.include || defaultInclude
    });
  },

  updateWorkspace: async (id, data) => {
    return await prisma.workspace.update({
      where: { id },
      data,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  deleteWorkspace: async (id) => {
    return await prisma.workspace.delete({
      where: { id }
    });
  },

  getMembers: async (workspaceId) => {
    return await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });
  },

  getInvitations: async (workspaceId) => {
    return await prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
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
  },

  sendInvitations: async (workspaceId, invitations, invitedById, workspaceName) => {
    const results = [];
    
    for (const invitation of invitations) {
      const { email, role } = invitation;
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const newInvitation = await prisma.workspaceInvitation.create({
        data: {
          email,
          role: role === 'org:admin' ? 'ADMIN' : 'MEMBER',
          token: inviteToken,
          expiresAt,
          workspaceId,
          invitedById
        }
      });

      const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`;
      await sendInvitationEmail(email, workspaceName, inviteLink);
      
      results.push(newInvitation);
    }

    return results;
  },

  getInvitationByToken: async (token) => {
    return await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    });
  },

  acceptInvitation: async (token, name, password) => {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true }
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    if (invitation.acceptedAt) {
      throw new Error('Invitation already accepted');
    }

    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: {
          name,
          email: invitation.email,
          password: hashedPassword
        }
      });
    }

    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role
      }
    });

    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });

    return { workspace: invitation.workspace };
  },

  updateMemberRole: async (workspaceId, userId, role) => {
    return await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });
  },

  removeMember: async (workspaceId, userId) => {
    return await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });
  }
};

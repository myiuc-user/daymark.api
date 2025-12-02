import prisma from '../config/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendInvitationEmail } from './emailService.js';
import { VALID_WORKSPACE_ROLES } from '../utils/permissions.js';

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

  duplicateWorkspace: async (id, userId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            tasks: {
              include: {
                subtasks: true
              }
            }
          }
        }
      }
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const newSlug = `${workspace.slug}-copy-${Date.now()}`;
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: `${workspace.name} (Copy)`,
        description: workspace.description,
        slug: newSlug,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN'
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Duplicate projects
    for (const project of workspace.projects) {
      const newProject = await prisma.project.create({
        data: {
          name: project.name,
          description: project.description,
          workspaceId: newWorkspace.id,
          status: project.status,
          team_lead: userId
        }
      });

      // Duplicate tasks
      for (const task of project.tasks) {
        const newTask = await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            projectId: newProject.id,
            status: task.status,
            priority: task.priority,
            storyPoints: task.storyPoints,
            due_date: task.due_date,
            assigneeId: userId,
            createdById: userId
          }
        });

        // Duplicate subtasks
        for (const subtask of task.subtasks) {
          await prisma.task.create({
            data: {
              title: subtask.title,
              projectId: newProject.id,
              status: subtask.status,
              priority: subtask.priority,
              due_date: subtask.due_date,
              assigneeId: userId,
              createdById: userId,
              parentTaskId: newTask.id
            }
          });
        }
      }
    }

    return newWorkspace;
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
      
      if (!VALID_WORKSPACE_ROLES.includes(role)) {
        throw new Error(`Invalid role: ${role}. Valid roles are: ${VALID_WORKSPACE_ROLES.join(', ')}`);
      }

      const inviteToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const newInvitation = await prisma.workspaceInvitation.create({
        data: {
          email,
          role,
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
    if (!VALID_WORKSPACE_ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role}. Valid roles are: ${VALID_WORKSPACE_ROLES.join(', ')}`);
    }

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

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { notificationService } from './notificationService.js';
import { githubService } from './githubService.js';
import { githubAuthService } from './githubAuthService.js';

export const projectService = {
  getProjects: async (workspaceId, userId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!workspace || (workspace.ownerId !== userId && workspace.members.length === 0)) {
      throw new Error('Access denied');
    }

    return await prisma.project.findMany({
      where: { workspaceId },
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
        tasks: {
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  createProject: async (data, userId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: data.workspaceId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    if (!workspace || (workspace.ownerId !== userId && workspace.members.length === 0)) {
      throw new Error('Access denied');
    }

    return await prisma.project.create({
      data: {
        ...data,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        workspace: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
  },

  getProjectById: async (id, options = {}) => {
    const defaultInclude = {
      owner: {
        select: { id: true, name: true, email: true }
      },
      workspace: {
        select: { id: true, name: true, slug: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true }
          }
        }
      },
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    };

    return await prisma.project.findUnique({
      where: { id },
      ...options,
      include: options.include || defaultInclude
    });
  },

  checkProjectAccess: async (project, userId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: project.workspaceId },
      include: {
        members: {
          where: { userId }
        }
      }
    });

    return workspace.ownerId === userId || 
      workspace.members.length > 0 ||
      project.team_lead === userId ||
      project.members.some(member => member.userId === userId);
  },

  updateProject: async (id, data) => {
    return await prisma.project.update({
      where: { id },
      data: {
        ...data,
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        workspace: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
  },

  deleteProject: async (id) => {
    return await prisma.project.delete({
      where: { id }
    });
  },

  addMember: async (projectId, email, project) => {
    const workspaceMember = project.workspace.members.find(
      member => member.user.email === email
    );

    if (!workspaceMember) {
      throw new Error('User not found in workspace');
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: workspaceMember.userId,
          projectId
        }
      }
    });

    if (existingMember) {
      throw new Error('User is already a project member');
    }

    await prisma.projectMember.create({
      data: {
        userId: workspaceMember.userId,
        projectId
      }
    });

    await notificationService.sendToUser(workspaceMember.userId, {
      type: 'success',
      title: 'Added to Project',
      message: `You have been added to project "${project.name}"`,
      data: { projectId, projectName: project.name }
    });

    await notificationService.sendToProject(projectId, {
      type: 'info',
      title: 'New Team Member',
      message: `${workspaceMember.user.name || workspaceMember.user.email} joined the project`,
      data: { projectId, projectName: project.name }
    });

    return await this.getProjectById(projectId);
  },

  removeMember: async (projectId, userId) => {
    const userToRemove = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      }
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true }
    });

    await notificationService.sendToUser(userId, {
      type: 'warning',
      title: 'Removed from Project',
      message: `You have been removed from project "${project.name}"`,
      data: { projectId, projectName: project.name }
    });

    await notificationService.sendToProject(projectId, {
      type: 'info',
      title: 'Team Member Left',
      message: `${userToRemove?.name || userToRemove?.email} was removed from the project`,
      data: { projectId, projectName: project.name }
    });

    return await this.getProjectById(projectId);
  },

  connectGithub: async (projectId, githubRepo, userId) => {
    const [owner, repo] = githubRepo.split('/');
    
    const token = await githubAuthService.getUserToken(userId);
    if (!token) {
      throw new Error('GitHub account not connected. Please connect your GitHub account first.');
    }

    const [repoInfo, codeMetrics] = await Promise.all([
      githubService.getRepoInfo(owner, repo, token),
      githubService.getCodeMetrics(owner, repo, token)
    ]);

    const githubData = {
      ...repoInfo,
      codeMetrics,
      estimation: githubService.calculateCOCOMO(codeMetrics.estimatedLOC),
      lastSync: new Date().toISOString()
    };

    return await prisma.project.update({
      where: { id: projectId },
      data: {
        githubRepo,
        githubData
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } }
      }
    });
  },

  disconnectGithub: async (projectId) => {
    return await prisma.project.update({
      where: { id: projectId },
      data: {
        githubRepo: null,
        githubData: null
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } }
      }
    });
  },

  syncGithub: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { githubRepo: true }
    });

    const [owner, repo] = project.githubRepo.split('/');
    
    const token = await githubAuthService.getUserToken(userId);
    if (!token) {
      throw new Error('GitHub account not connected');
    }

    const [repoInfo, codeMetrics] = await Promise.all([
      githubService.getRepoInfo(owner, repo, token),
      githubService.getCodeMetrics(owner, repo, token)
    ]);

    const githubData = {
      ...repoInfo,
      codeMetrics,
      estimation: githubService.calculateCOCOMO(codeMetrics.estimatedLOC),
      lastSync: new Date().toISOString()
    };

    return await prisma.project.update({
      where: { id: projectId },
      data: { githubData },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } }
      }
    });
  }
};

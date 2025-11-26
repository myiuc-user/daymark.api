import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const analyticsService = {
  getWorkspaceAnalytics: async (workspaceId, userId) => {
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

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        tasks: true
      }
    });

    const totalProjects = projects.length;
    const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'COMPLETED').length, 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalProjects,
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
      teamSize: workspace.members.length + 1
    };
  },

  getProjectAnalytics: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId }
            }
          }
        },
        tasks: true,
        members: true
      }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionRate: Math.round(completionRate),
      teamSize: project.members.length
    };
  },

  getDashboard: async (id, userId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId }
        },
        projects: {
          include: {
            tasks: true
          }
        }
      }
    });

    if (!workspace || (workspace.ownerId !== userId && workspace.members.length === 0)) {
      throw new Error('Access denied');
    }

    const totalProjects = workspace.projects.length;
    const totalTasks = workspace.projects.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = workspace.projects.reduce((sum, p) => sum + p.tasks.filter(t => t.status === 'COMPLETED').length, 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name
      },
      totalProjects,
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
      teamSize: workspace.members.length + 1
    };
  }
};

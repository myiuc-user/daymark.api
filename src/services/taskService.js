import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { notificationService } from './notificationService.js';

export const taskService = {
  getTasks: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  createTask: async (data, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.task.create({
      data: {
        ...data,
        createdById: userId,
        due_date: data.dueDate ? new Date(data.dueDate) : new Date()
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  getTaskById: async (id, options = {}) => {
    const defaultInclude = {
      assignee: {
        select: { id: true, name: true, email: true }
      },
      createdBy: {
        select: { id: true, name: true, email: true }
      },
      project: {
        select: { id: true, name: true }
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    };

    return await prisma.task.findUnique({
      where: { id },
      include: options.include || defaultInclude
    });
  },

  checkTaskAccess: async (task, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId }
            }
          }
        },
        members: {
          where: { userId }
        }
      }
    });

    return project.workspace.ownerId === userId || 
      project.workspace.members.length > 0 ||
      project.team_lead === userId ||
      project.members.length > 0 ||
      task.assigneeId === userId;
  },

  checkTaskUpdateAccess: async (task, userId) => {
    const project = task.project;
    return project.workspace.ownerId === userId || 
      project.team_lead === userId ||
      task.createdById === userId;
  },

  updateTask: async (id, data) => {
    return await prisma.task.update({
      where: { id },
      data: {
        ...data,
        due_date: data.dueDate ? new Date(data.dueDate) : undefined
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  },

  deleteTask: async (id) => {
    return await prisma.task.delete({
      where: { id }
    });
  },

  addComment: async (taskId, content, userId) => {
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true }
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await notificationService.sendToUser(task.assigneeId, {
        type: 'info',
        title: 'New Comment',
        message: 'A new comment was added to your task',
        data: { taskId }
      });
    }

    return comment;
  },

  getComments: async (taskId) => {
    return await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  },

  getWatchers: async (taskId) => {
    const watchers = await prisma.taskWatcher.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return watchers.map(w => w.user);
  },

  addWatcher: async (taskId, userId) => {
    return await prisma.taskWatcher.create({
      data: { taskId, userId }
    });
  },

  removeWatcher: async (taskId, userId) => {
    return await prisma.taskWatcher.deleteMany({
      where: { taskId, userId }
    });
  }
};

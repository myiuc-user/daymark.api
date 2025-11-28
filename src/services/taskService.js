import prisma from '../config/prisma.js';
import { notificationService } from './notificationService.js';
import { taskHistoryService } from './taskHistoryService.js';

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

  updateTask: async (id, data, userId) => {
    const oldTask = await prisma.task.findUnique({ where: { id } });
    
    const updatedTask = await prisma.task.update({
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

    if (oldTask && userId) {
      const changes = {};
      if (data.title !== undefined && oldTask.title !== data.title) {
        changes.title = { oldValue: oldTask.title, newValue: data.title };
      }
      if (data.description !== undefined && oldTask.description !== data.description) {
        changes.description = { oldValue: oldTask.description, newValue: data.description };
      }
      if (data.status !== undefined && oldTask.status !== data.status) {
        changes.status = { oldValue: oldTask.status, newValue: data.status };
      }
      if (data.priority !== undefined && oldTask.priority !== data.priority) {
        changes.priority = { oldValue: oldTask.priority, newValue: data.priority };
      }
      if (data.assigneeId !== undefined && oldTask.assigneeId !== data.assigneeId) {
        changes.assigneeId = { oldValue: oldTask.assigneeId, newValue: data.assigneeId };
      }
      if (Object.keys(changes).length > 0) {
        await taskHistoryService.recordMultipleChanges(id, changes, userId);
      }
    }

    return updatedTask;
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
  },

  toggleFavorite: async (id) => {
    const task = await prisma.task.findUnique({ where: { id } });
    return await prisma.task.update({
      where: { id },
      data: { isFavorite: !task.isFavorite },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  },

  toggleArchive: async (id) => {
    const task = await prisma.task.findUnique({ where: { id } });
    return await prisma.task.update({
      where: { id },
      data: { isArchived: !task.isArchived },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  },

  getSubtasks: async (parentTaskId) => {
    try {
      return await prisma.task.findMany({
        where: { parentTaskId },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      console.error('Error fetching subtasks:', error);
      return [];
    }
  },

  createSubtask: async (parentTaskId, data, userId) => {
    const parentTask = await prisma.task.findUnique({
      where: { id: parentTaskId },
      include: { project: true }
    });

    if (!parentTask) {
      throw new Error('Parent task not found');
    }

    try {
      return await prisma.task.create({
        data: {
          title: data.title,
          projectId: parentTask.projectId,
          parentTaskId,
          assigneeId: data.assigneeId || parentTask.assigneeId,
          due_date: data.dueDate || parentTask.due_date,
          createdById: userId,
          status: 'TODO',
          priority: data.priority || 'MEDIUM'
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });
    } catch (error) {
      console.error('Error creating subtask:', error);
      return { id: 'temp', title: data.title, status: 'TODO' };
    }
  },

  toggleSubtaskStatus: async (subtaskId) => {
    const subtask = await prisma.task.findUnique({ where: { id: subtaskId } });
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
    return await prisma.task.update({
      where: { id: subtaskId },
      data: { status: newStatus },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  },

  updateTaskStatus: async (id, status) => {
    return await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  }
};

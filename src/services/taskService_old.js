import prisma from '../config/prisma.js';
import { notificationService } from './notificationService.js';
import { ROLE_HIERARCHY, hasRoleOrHigher } from '../utils/permissionHelpers.js';
import { addDays, addWeeks, addMonths } from 'date-fns';

const getEffectiveRole = (projectRole, workspaceRole) => {
  const pRole = projectRole || 'VIEWER';
  const wRole = workspaceRole || 'VIEWER';
  return ROLE_HIERARCHY[pRole] >= ROLE_HIERARCHY[wRole] ? pRole : wRole;
};

const validateAssigneeIsMember = async (projectId, assigneeId) => {
  const isMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: assigneeId, projectId }
    }
  });

  if (!isMember) {
    throw new Error('Assignee must be a project member');
  }
};

export const taskService = {
  // Task CRUD
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
        },
        members: {
          where: { userId }
        }
      }
    });

    if (!project) throw new Error('Project not found');

    const isOwner = project.workspace.ownerId === userId;
    const isTeamLead = project.team_lead === userId;
    const workspaceMember = project.workspace.members[0];
    const projectMember = project.members[0];

    if (!isOwner && !isTeamLead && !workspaceMember && !projectMember) {
      throw new Error('Access denied');
    }

    return await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  createTask: async (data, userId, userRole = '') => {
    const isSuperAdmin = userRole?.toUpperCase?.() === 'SUPER_ADMIN';
    
    const assigneeId = data.assigneeId || userId;
    
    if (isSuperAdmin) {
      await validateAssigneeIsMember(data.projectId, assigneeId);
      const task = await prisma.task.create({
        data: {
          ...data,
          assigneeId,
          createdById: userId,
          due_date: data.due_date ? new Date(data.due_date) : new Date()
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      await notificationService.notifyProjectMembers(task, userId);
      return task;
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        workspace: {
          include: {
            members: { where: { userId } }
          }
        },
        members: { where: { userId } }
      }
    });

    if (!project) throw new Error('Project not found');

    const isOwner = project.workspace.ownerId === userId;
    const isTeamLead = project.team_lead === userId;
    const workspaceMember = project.workspace.members[0];
    const projectMember = project.members[0];

    if (!isOwner && !isTeamLead && !workspaceMember && !projectMember) {
      throw new Error('Access denied');
    }

    const effectiveRole = getEffectiveRole(projectMember?.role, workspaceMember?.role);
    if (!hasRoleOrHigher(effectiveRole, 'MEMBER')) {
      throw new Error('Insufficient permissions');
    }

    await validateAssigneeIsMember(data.projectId, assigneeId);

    const task = await prisma.task.create({
      data: {
        ...data,
        assigneeId,
        createdById: userId,
        due_date: data.due_date ? new Date(data.due_date) : new Date()
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    await notificationService.notifyProjectMembers(task, userId);
    return task;
  },

  getTaskById: async (id, options = {}) => {
    const defaultInclude = {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
      comments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      }
    };

    return await prisma.task.findUnique({
      where: { id },
      include: options.include || defaultInclude
    });
  },

  checkTaskAccess: async (task, userId, userRole = '', requiredRole = 'VIEWER') => {
    const isSuperAdmin = userRole?.toUpperCase?.() === 'SUPER_ADMIN';
    if (isSuperAdmin) return true;

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: {
        workspace: {
          include: {
            members: { where: { userId } }
          }
        },
        members: { where: { userId } }
      }
    });

    if (!project) return false;

    const isOwner = project.workspace.ownerId === userId;
    const isTeamLead = project.team_lead === userId;
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.createdById === userId;

    if (isOwner || isTeamLead || isAssignee || isCreator) return true;

    const workspaceMember = project.workspace.members[0];
    const projectMember = project.members[0];

    if (!workspaceMember && !projectMember) return false;

    const effectiveRole = getEffectiveRole(projectMember?.role, workspaceMember?.role);
    return hasRoleOrHigher(effectiveRole, requiredRole);
  },

  checkTaskUpdateAccess: async (task, userId, userRole = '') => {
    const isSuperAdmin = userRole?.toUpperCase?.() === 'SUPER_ADMIN';
    if (isSuperAdmin) return true;

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: {
        workspace: { include: { members: { where: { userId } } } },
        members: { where: { userId } }
      }
    });

    if (!project) return false;

    const isOwner = project.workspace.ownerId === userId;
    const isTeamLead = project.team_lead === userId;
    const isAssignee = task.assigneeId === userId;
    const isCreator = task.createdById === userId;

    if (isOwner || isTeamLead || isAssignee || isCreator) return true;

    const workspaceMember = project.workspace.members[0];
    const projectMember = project.members[0];

    if (!workspaceMember && !projectMember) return false;

    const effectiveRole = getEffectiveRole(projectMember?.role, workspaceMember?.role);
    return hasRoleOrHigher(effectiveRole, 'MEMBER');
  },

  updateTask: async (id, data, userId) => {
    const oldTask = await prisma.task.findUnique({ where: { id } });

    if (data.assigneeId && data.assigneeId !== oldTask.assigneeId) {
      await validateAssigneeIsMember(oldTask.projectId, data.assigneeId);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: data,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
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
      if (data.due_date !== undefined && oldTask.due_date !== data.due_date) {
        changes.due_date = { oldValue: oldTask.due_date, newValue: data.due_date };
      }
      if (data.assigneeId !== undefined && oldTask.assigneeId !== data.assigneeId) {
        changes.assigneeId = { oldValue: oldTask.assigneeId, newValue: data.assigneeId };
      }
      if (Object.keys(changes).length > 0) {
        await taskService.recordMultipleChanges(id, changes, userId);
      }
    }

    return updatedTask;
  },

  deleteTask: async (id) => {
    return await prisma.task.delete({ where: { id } });
  },

  // Comments
  addComment: async (taskId, content, userId) => {
    const comment = await prisma.comment.create({
      data: { content, taskId, userId },
      include: { user: { select: { id: true, name: true, email: true } } }
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
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    });
  },

  // Watchers
  getWatchers: async (taskId) => {
    const watchers = await prisma.taskWatcher.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    return watchers.map(w => w.user);
  },

  addWatcher: async (taskId, userId) => {
    return await prisma.taskWatcher.create({ data: { taskId, userId } });
  },

  removeWatcher: async (taskId, userId) => {
    return await prisma.taskWatcher.deleteMany({ where: { taskId, userId } });
  },

  // Subtasks
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

    if (!parentTask) throw new Error('Parent task not found');

    try {
      return await prisma.task.create({
        data: {
          title: data.title,
          projectId: parentTask.projectId,
          parentTaskId,
          assigneeId: data.assigneeId || parentTask.assigneeId,
          due_date: data.due_date || parentTask.due_date,
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

  // Status
  updateTaskStatus: async (id, status) => {
    return await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  },

  // Favorites & Archive
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

  // Dependencies
  addDependency: async (taskId, dependsOnId, dependencyType = 'BLOCKS') => {
    if (taskId === dependsOnId) {
      throw new Error('A task cannot depend on itself');
    }

    const existing = await prisma.taskDependency.findUnique({
      where: { taskId_dependsOnId: { taskId, dependsOnId } }
    });

    if (existing) {
      throw new Error('Dependency already exists');
    }

    return await prisma.taskDependency.create({
      data: { taskId, dependsOnId, dependencyType }
    });
  },

  removeDependency: async (taskId, dependsOnId) => {
    return await prisma.taskDependency.delete({
      where: { taskId_dependsOnId: { taskId, dependsOnId } }
    });
  },

  getTaskDependencies: async (taskId) => {
    return await prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOn: { select: { id: true, title: true, status: true } }
      }
    });
  },

  getBlockingTasks: async (taskId) => {
    return await prisma.taskDependency.findMany({
      where: { dependsOnId: taskId, dependencyType: 'BLOCKS' },
      include: {
        task: { select: { id: true, title: true, status: true } }
      }
    });
  },

  hasCyclicDependency: async (taskId, dependsOnId) => {
    const visited = new Set();
    const queue = [dependsOnId];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === taskId) return true;
      if (visited.has(current)) continue;

      visited.add(current);
      const deps = await prisma.taskDependency.findMany({
        where: { taskId: current }
      });

      deps.forEach(dep => queue.push(dep.dependsOnId));
    }

    return false;
  },

  // History
  recordChange: async (taskId, field, oldValue, newValue, changedBy) => {
    try {
      return await prisma.taskHistory.create({
        data: {
          taskId,
          field,
          oldValue: String(oldValue),
          newValue: String(newValue),
          changedBy
        },
        include: { user: { select: { id: true, name: true, email: true } } }
      });
    } catch (error) {
      console.error('Error recording task history:', error);
    }
  },

  getTaskHistory: async (taskId) => {
    return await prisma.taskHistory.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  recordMultipleChanges: async (taskId, changes, changedBy) => {
    const histories = [];
    for (const [field, { oldValue, newValue }] of Object.entries(changes)) {
      if (oldValue !== newValue) {
        histories.push(
          await taskService.recordChange(taskId, field, oldValue, newValue, changedBy)
        );
      }
    }
    return histories;
  },

  // Recurring Tasks
  createRecurringTask: async (projectId, data, userId) => {
    const nextDueDate = new Date(data.nextDueDate);
    
    return await prisma.recurringTask.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        nextDueDate,
        isActive: true
      }
    });
  },

  getRecurringTasks: async (projectId) => {
    return await prisma.recurringTask.findMany({
      where: { projectId, isActive: true },
      orderBy: { nextDueDate: 'asc' }
    });
  },

  updateRecurringTask: async (recurringTaskId, data) => {
    return await prisma.recurringTask.update({
      where: { id: recurringTaskId },
      data: {
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth
      }
    });
  },

  deleteRecurringTask: async (recurringTaskId) => {
    return await prisma.recurringTask.update({
      where: { id: recurringTaskId },
      data: { isActive: false }
    });
  },

  executeRecurringTasks: async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const recurringTasks = await prisma.recurringTask.findMany({
      where: { isActive: true, nextDueDate: { lte: now } },
      include: { project: true }
    });

    for (const recurring of recurringTasks) {
      try {
        const nextDueDate = taskService.calculateNextDueDate(recurring);
        
        if (nextDueDate <= now) {
          await taskService.createTask({
            title: recurring.title,
            description: recurring.description,
            projectId: recurring.projectId,
            dueDate: nextDueDate,
            priority: 'MEDIUM',
            status: 'TODO',
            createdById: recurring.project.team_lead
          }, recurring.project.team_lead);

          await prisma.recurringTask.update({
            where: { id: recurring.id },
            data: { nextDueDate }
          });
        }
      } catch (error) {
        console.error(`Error executing recurring task ${recurring.id}:`, error);
      }
    }
  },

  calculateNextDueDate: (recurring) => {
    const current = new Date(recurring.nextDueDate);
    current.setHours(0, 0, 0, 0);
    
    let next;
    switch (recurring.frequency) {
      case 'DAILY':
        next = addDays(current, 1);
        break;
      case 'WEEKLY':
        next = addWeeks(current, 1);
        break;
      case 'MONTHLY':
        next = addMonths(current, 1);
        break;
      default:
        next = addDays(current, 1);
    }
    next.setHours(0, 0, 0, 0);
    return next;
  }
};

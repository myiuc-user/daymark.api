import prisma from '../config/prisma.js';
import { taskService } from './taskService.js';
import { addDays, addWeeks, addMonths } from 'date-fns';

export const recurringTaskService = {
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
        const nextDueDate = recurringTaskService.calculateNextDueDate(recurring);
        
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

import prisma from '../config/prisma.js';
import { addDays, addWeeks, addMonths } from 'date-fns';

export const recurringTaskService = {
  createRecurringTask: async (projectId, data) => {
    return await prisma.recurringTask.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        frequency: data.frequency,
        dayOfWeek: data.dayOfWeek,
        dayOfMonth: data.dayOfMonth,
        nextDueDate: data.nextDueDate || new Date()
      }
    });
  },

  getRecurringTasks: async (projectId) => {
    return await prisma.recurringTask.findMany({
      where: { projectId, isActive: true }
    });
  },

  processRecurringTasks: async () => {
    const now = new Date();
    const tasks = await prisma.recurringTask.findMany({
      where: { isActive: true, nextDueDate: { lte: now } },
      include: { project: true }
    });

    for (const recurring of tasks) {
      await prisma.task.create({
        data: {
          projectId: recurring.projectId,
          title: recurring.title,
          description: recurring.description,
          due_date: recurring.nextDueDate,
          assigneeId: recurring.project.team_lead,
          createdById: recurring.project.team_lead,
          status: 'TODO'
        }
      });

      const nextDate = calculateNextDate(recurring.nextDueDate, recurring.frequency, recurring.dayOfWeek, recurring.dayOfMonth);
      await prisma.recurringTask.update({
        where: { id: recurring.id },
        data: { nextDueDate: nextDate }
      });
    }
  },

  updateRecurringTask: async (id, data) => {
    return await prisma.recurringTask.update({
      where: { id },
      data
    });
  },

  deleteRecurringTask: async (id) => {
    return await prisma.recurringTask.update({
      where: { id },
      data: { isActive: false }
    });
  }
};

function calculateNextDate(currentDate, frequency, dayOfWeek, dayOfMonth) {
  switch (frequency) {
    case 'DAILY':
      return addDays(currentDate, 1);
    case 'WEEKLY':
      return addWeeks(currentDate, 1);
    case 'MONTHLY':
      return addMonths(currentDate, 1);
    default:
      return addWeeks(currentDate, 1);
  }
}

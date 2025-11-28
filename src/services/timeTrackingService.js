import prisma from '../config/prisma.js';

export const timeTrackingService = {
  logTime: async (taskId, data) => {
    if (data.hours <= 0 || data.hours > 24) {
      throw new Error('Hours must be between 0 and 24');
    }

    const entryDate = new Date(data.date);
    if (entryDate > new Date()) {
      throw new Error('Cannot log time for future dates');
    }

    const entry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId: data.userId,
        hours: data.hours,
        description: data.description,
        date: entryDate
      },
      include: { user: true, task: true }
    });

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    const newActualHours = (task.actualHours || 0) + data.hours;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        actualHours: newActualHours
      }
    });

    return entry;
  },

  getTimeEntries: async (taskId, projectId) => {
    if (taskId) {
      return await prisma.timeEntry.findMany({
        where: { taskId },
        include: { user: true },
        orderBy: { date: 'desc' }
      });
    }

    if (projectId) {
      return await prisma.timeEntry.findMany({
        where: { task: { projectId } },
        include: { user: true, task: true },
        orderBy: { date: 'desc' }
      });
    }

    return [];
  },

  getSummary: async (projectId) => {
    const entries = await prisma.timeEntry.findMany({
      where: { task: { projectId } },
      include: { task: true, user: true }
    });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: { id: true, title: true, estimatedHours: true, actualHours: true }
    });

    const totalLogged = entries.reduce((sum, e) => sum + e.hours, 0);
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const summary = {
      totalLogged,
      totalEstimated,
      efficiency: 0,
      overBudget: [],
      byUser: {},
      byTask: {}
    };

    entries.forEach(entry => {
      if (!summary.byUser[entry.user.name]) {
        summary.byUser[entry.user.name] = 0;
      }
      summary.byUser[entry.user.name] += entry.hours;
    });

    tasks.forEach(task => {
      const efficiency = task.estimatedHours && task.actualHours 
        ? (task.estimatedHours / task.actualHours * 100).toFixed(1) 
        : 0;
      summary.byTask[task.id] = {
        title: task.title,
        estimated: task.estimatedHours || 0,
        actual: task.actualHours || 0,
        efficiency: efficiency
      };

      if (task.actualHours > task.estimatedHours) {
        summary.overBudget.push({
          taskId: task.id,
          title: task.title,
          estimated: task.estimatedHours,
          actual: task.actualHours,
          overBy: (task.actualHours - task.estimatedHours).toFixed(1)
        });
      }
    });

    summary.efficiency = totalLogged > 0 && totalEstimated > 0
      ? (totalEstimated / totalLogged * 100).toFixed(1) 
      : 0;

    return summary;
  },

  deleteTimeEntry: async (entryId) => {
    const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
    
    if (entry) {
      await prisma.task.update({
        where: { id: entry.taskId },
        data: {
          actualHours: {
            decrement: entry.hours
          }
        }
      });
    }

    return await prisma.timeEntry.delete({ where: { id: entryId } });
  }
};

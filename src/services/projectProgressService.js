import prisma from '../config/prisma.js';

export const projectProgressService = {
  calculateProjectProgress: async (projectId) => {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: { status: true }
    });

    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    return Math.round((completedTasks / tasks.length) * 100);
  },

  getProjectStats: async (projectId) => {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: { status: true }
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'DONE').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, todo, progress };
  }
};

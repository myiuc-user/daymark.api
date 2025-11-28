import prisma from '../config/prisma.js';

export const taskDependencyService = {
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
  }
};

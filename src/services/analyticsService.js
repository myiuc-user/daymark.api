import prisma from '../config/prisma.js';

export const analyticsService = {
  getProjectAnalytics: async (projectId) => {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignee: true, timeEntries: true }
    });

    const completed = tasks.filter(t => t.status === 'DONE').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;
    const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const estimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    return {
      totalTasks: tasks.length,
      completed,
      inProgress,
      todo,
      completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
      totalHours,
      estimatedHours,
      efficiency: estimatedHours > 0 ? Math.round((estimatedHours / totalHours) * 100) : 0,
      byAssignee: tasks.reduce((acc, task) => {
        if (task.assignee) {
          if (!acc[task.assignee.name]) {
            acc[task.assignee.name] = { completed: 0, total: 0 };
          }
          acc[task.assignee.name].total++;
          if (task.status === 'DONE') acc[task.assignee.name].completed++;
        }
        return acc;
      }, {})
    };
  },

  getTeamAnalytics: async (workspaceId) => {
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: { tasks: { include: { assignee: true } } }
    });

    const allTasks = projects.flatMap(p => p.tasks);
    const completed = allTasks.filter(t => t.status === 'DONE').length;
    const users = await prisma.user.findMany({
      where: { workspaces: { some: { workspaceId } } }
    });

    return {
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      completedTasks: completed,
      completionRate: allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0,
      teamSize: users.length,
      projectStats: projects.map(p => ({
        name: p.name,
        tasks: p.tasks.length,
        completed: p.tasks.filter(t => t.status === 'DONE').length
      }))
    };
  }
};

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const timeTrackingService = {
  getTimeEntries: async (taskId, userId) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!task || (task.project.workspace.ownerId !== userId && task.project.workspace.members.length === 0 && task.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  createTimeEntry: async (data) => {
    return await prisma.timeEntry.create({
      data,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
  },

  deleteTimeEntry: async (id, userId) => {
    const entry = await prisma.timeEntry.findUnique({
      where: { id }
    });

    if (!entry || entry.userId !== userId) {
      throw new Error('Access denied');
    }

    return await prisma.timeEntry.delete({
      where: { id }
    });
  }
};

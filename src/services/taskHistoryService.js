import prisma from '../config/prisma.js';

export const taskHistoryService = {
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
          await taskHistoryService.recordChange(taskId, field, oldValue, newValue, changedBy)
        );
      }
    }
    return histories;
  }
};

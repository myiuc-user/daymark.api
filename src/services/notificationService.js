import prisma from '../config/prisma.js';

export const notificationService = {
  getUserNotifications: async (userId) => {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  markAsRead: async (id) => {
    return await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
  },

  deleteNotification: async (id) => {
    return await prisma.notification.delete({
      where: { id }
    });
  },

  sendToUser: async (userId, data) => {
    return await prisma.notification.create({
      data: {
        userId,
        ...data
      }
    });
  },

  sendToProject: async (projectId, data, excludeUserId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    const userIds = project.members
      .map(m => m.userId)
      .filter(id => id !== excludeUserId);

    return await Promise.all(
      userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            ...data
          }
        })
      )
    );
  }
};

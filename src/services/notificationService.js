import prisma from '../config/prisma.js';
import { socketService } from './socketService.js';

export const notificationService = {
  createNotification: async (userId, data) => {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      if (prefs && !prefs.inAppNotifications) return null;
      if (!prefs) {
        await prisma.notificationPreference.create({
          data: { userId, inAppNotifications: true }
        });
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedId: data.relatedId,
          relatedType: data.relatedType
        }
      });

      if (socketService.io) {
        socketService.sendNotification(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: false
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  },

  notifyTaskAssignment: async (taskId, assigneeId, assignedBy) => {
    if (assigneeId === assignedBy) return null;
    
    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      const assigner = await prisma.user.findUnique({ where: { id: assignedBy } });

      return notificationService.createNotification(assigneeId, {
        type: 'assignment',
        title: 'Task Assigned',
        message: `${assigner.name} assigned you "${task.title}"`,
        relatedId: taskId,
        relatedType: 'task'
      });
    } catch (error) {
      console.error('Error notifying task assignment:', error);
      return null;
    }
  },

  notifyTaskComment: async (taskId, commenterId, taskOwnerId) => {
    if (commenterId === taskOwnerId) return;

    try {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      const commenter = await prisma.user.findUnique({ where: { id: commenterId } });

      return notificationService.createNotification(taskOwnerId, {
        type: 'comment',
        title: 'New Comment',
        message: `${commenter.name} commented on "${task.title}"`,
        relatedId: taskId,
        relatedType: 'task'
      });
    } catch (error) {
      console.error('Error notifying task comment:', error);
      return null;
    }
  },

  notifyMention: async (userId, mentionedBy, taskId, taskTitle) => {
    try {
      const mentioner = await prisma.user.findUnique({ where: { id: mentionedBy } });

      return notificationService.createNotification(userId, {
        type: 'mention',
        title: 'You were mentioned',
        message: `${mentioner.name} mentioned you in "${taskTitle}"`,
        relatedId: taskId,
        relatedType: 'task'
      });
    } catch (error) {
      console.error('Error notifying mention:', error);
      return null;
    }
  },

  notifyTaskUpdate: async (taskId, updatedBy, changes) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { watchers: true, assignee: true }
      });

      const updater = await prisma.user.findUnique({ where: { id: updatedBy } });
      const changeText = Object.keys(changes).join(', ');

      const notifyUsers = new Set([
        task.assigneeId,
        ...task.watchers.map(w => w.userId)
      ].filter(Boolean));

      for (const userId of notifyUsers) {
        if (userId !== updatedBy) {
          await notificationService.createNotification(userId, {
            type: 'task_update',
            title: 'Task Updated',
            message: `${updater.name} updated "${task.title}" (${changeText})`,
            relatedId: taskId,
            relatedType: 'task'
          });
        }
      }
    } catch (error) {
      console.error('Error notifying task update:', error);
    }
  },

  notifyTaskCompleted: async (taskId, completedBy) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { watchers: true, assignee: true }
      });

      const completer = await prisma.user.findUnique({ where: { id: completedBy } });

      const notifyUsers = new Set([
        task.assigneeId,
        ...task.watchers.map(w => w.userId)
      ].filter(Boolean));

      for (const userId of notifyUsers) {
        if (userId !== completedBy) {
          await notificationService.createNotification(userId, {
            type: 'task_completed',
            title: 'Task Completed',
            message: `${completer.name} completed "${task.title}"`,
            relatedId: taskId,
            relatedType: 'task'
          });
        }
      }
    } catch (error) {
      console.error('Error notifying task completion:', error);
    }
  },

  getNotifications: async (userId, limit = 50) => {
    const notifications = await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return notifications;
  },

  loadNotificationsForUser: async (userId) => {
    const notifications = await notificationService.getNotifications(userId);
    
    if (socketService.io) {
      notifications.forEach(notification => {
        socketService.sendNotification(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: false
        });
      });
    }

    return notifications;
  },

  markAsRead: async (notificationId, userId) => {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true }
    });

    if (socketService.io) {
      socketService.io.to(`user:${userId}`).emit('notification-read', { id: notificationId });
    }
    return notification;
  },

  markAllAsRead: async (userId) => {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    if (socketService.io) {
      socketService.io.to(`user:${userId}`).emit('notifications-cleared');
    }
  },

  deleteNotification: async (notificationId, userId) => {
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    if (socketService.io) {
      socketService.io.to(`user:${userId}`).emit('notification-deleted', { id: notificationId });
    }
  },

  sendToUser: async (userId, data) => {
    return notificationService.createNotification(userId, data);
  },

  sendToProject: async (projectId, data) => {
    try {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true }
      });

      for (const member of projectMembers) {
        await notificationService.createNotification(member.userId, data);
      }
    } catch (error) {
      console.error('Error sending notification to project:', error);
    }
  }
};

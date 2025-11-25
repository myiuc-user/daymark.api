import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const notifications = await notificationService.getUserNotifications(req.user.id);
      res.json({ notifications });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id);
      res.json({ notification });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      await notificationService.deleteNotification(id);
      res.json({ message: 'Notification deleted' });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

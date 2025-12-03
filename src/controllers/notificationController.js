import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  getNotifications: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const { notifications, total } = await notificationService.getNotifications(req.user.id, limit, offset);
      res.json({ notifications, total, limit, offset });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  loadNotifications: async (req, res) => {
    try {
      const notifications = await notificationService.loadNotificationsForUser(req.user.id);
      res.json({ notifications });
    } catch (error) {
      console.error('Load notifications error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getPreferences: async (req, res) => {
    try {
      const prefs = await notificationService.getPreferences(req.user.id);
      res.json({ preferences: prefs });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const prefs = await notificationService.updatePreferences(req.user.id, req.body);
      res.json({ preferences: prefs });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.user.id);
      res.json({ notification });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  markAllAsRead: async (req, res) => {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params;
      await notificationService.deleteNotification(id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  sendTestNotification: async (req, res) => {
    try {
      const notification = await notificationService.createNotification(req.user.id, {
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification from Daymark',
        relatedId: null,
        relatedType: null
      });
      res.json({ notification });
    } catch (error) {
      console.error('Send test notification error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

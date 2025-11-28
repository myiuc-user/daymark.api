import { notificationPreferenceService } from '../services/notificationPreferenceService.js';

export const notificationPreferenceController = {
  getPreferences: async (req, res) => {
    try {
      const prefs = await notificationPreferenceService.getPreferences(req.user.id);
      res.json({ preferences: prefs });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const { emailNotifications, inAppNotifications, digestFrequency } = req.body;
      const prefs = await notificationPreferenceService.updatePreferences(req.user.id, {
        emailNotifications,
        inAppNotifications,
        digestFrequency
      });
      res.json({ preferences: prefs });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

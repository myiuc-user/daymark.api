import { analyticsService } from '../services/analyticsService.js';

export const analyticsController = {
  getProjectAnalytics: async (req, res) => {
    try {
      const { projectId } = req.params;
      const analytics = await analyticsService.getProjectAnalytics(projectId);
      res.json({ analytics });
    } catch (error) {
      console.error('Get project analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getTeamAnalytics: async (req, res) => {
    try {
      const { workspaceId } = req.query;
      const analytics = await analyticsService.getTeamAnalytics(workspaceId);
      res.json({ analytics });
    } catch (error) {
      console.error('Get team analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

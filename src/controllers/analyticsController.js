import { analyticsService } from '../services/analyticsService.js';

export const analyticsController = {
  getWorkspaceAnalytics: async (req, res) => {
    try {
      const { workspaceId } = req.query;
      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required' });
      }

      const analytics = await analyticsService.getWorkspaceAnalytics(workspaceId, req.user.id, req.user.role);
      res.json({ analytics });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  getProjectAnalytics: async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const analytics = await analyticsService.getProjectAnalytics(projectId, req.user.id, req.user.role);
      res.json({ analytics });
    } catch (error) {
      console.error('Get project analytics error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  getDashboard: async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Dashboard request - userId:', req.user.id, 'role:', req.user.role);
      const dashboard = await analyticsService.getDashboard(id, req.user.id, req.user.role);
      res.json({ dashboard });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

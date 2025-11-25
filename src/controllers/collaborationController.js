import { collaborationService } from '../services/collaborationService.js';

export const collaborationController = {
  getCollaborations: async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const collaborations = await collaborationService.getCollaborations(projectId, req.user.id);
      res.json({ collaborations });
    } catch (error) {
      console.error('Get collaborations error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  createCollaboration: async (req, res) => {
    try {
      const { projectId, userId, role } = req.body;
      const collaboration = await collaborationService.createCollaboration({
        projectId,
        userId,
        role
      }, req.user.id);
      res.status(201).json({ collaboration });
    } catch (error) {
      console.error('Create collaboration error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  deleteCollaboration: async (req, res) => {
    try {
      const { id } = req.params;
      await collaborationService.deleteCollaboration(id, req.user.id);
      res.json({ message: 'Collaboration deleted' });
    } catch (error) {
      console.error('Delete collaboration error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

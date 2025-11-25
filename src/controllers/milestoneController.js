import { milestoneService } from '../services/milestoneService.js';

export const milestoneController = {
  getMilestones: async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const milestones = await milestoneService.getMilestones(projectId, req.user.id);
      res.json({ milestones });
    } catch (error) {
      console.error('Get milestones error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  createMilestone: async (req, res) => {
    try {
      const { title, description, dueDate, projectId } = req.body;
      const milestone = await milestoneService.createMilestone({
        title,
        description,
        dueDate,
        projectId
      }, req.user.id);
      res.status(201).json({ milestone });
    } catch (error) {
      console.error('Create milestone error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  updateMilestone: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, dueDate, status } = req.body;
      const milestone = await milestoneService.updateMilestone(id, {
        title,
        description,
        dueDate,
        status
      }, req.user.id);
      res.json({ milestone });
    } catch (error) {
      console.error('Update milestone error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  deleteMilestone: async (req, res) => {
    try {
      const { id } = req.params;
      await milestoneService.deleteMilestone(id, req.user.id);
      res.json({ message: 'Milestone deleted' });
    } catch (error) {
      console.error('Delete milestone error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

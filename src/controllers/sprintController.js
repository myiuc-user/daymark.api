import { sprintService } from '../services/sprintService.js';

export const sprintController = {
  getSprints: async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const sprints = await sprintService.getSprints(projectId, req.user.id);
      res.json({ sprints });
    } catch (error) {
      console.error('Get sprints error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  createSprint: async (req, res) => {
    try {
      const { name, startDate, endDate, projectId } = req.body;
      const sprint = await sprintService.createSprint({
        name,
        startDate,
        endDate,
        projectId
      }, req.user.id);
      res.status(201).json({ sprint });
    } catch (error) {
      console.error('Create sprint error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  updateSprint: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, startDate, endDate, status } = req.body;
      const sprint = await sprintService.updateSprint(id, {
        name,
        startDate,
        endDate,
        status
      }, req.user.id);
      res.json({ sprint });
    } catch (error) {
      console.error('Update sprint error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  deleteSprint: async (req, res) => {
    try {
      const { id } = req.params;
      await sprintService.deleteSprint(id, req.user.id);
      res.json({ message: 'Sprint deleted' });
    } catch (error) {
      console.error('Delete sprint error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

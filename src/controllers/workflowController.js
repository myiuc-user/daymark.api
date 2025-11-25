import { workflowService } from '../services/workflowService.js';

export const workflowController = {
  getWorkflows: async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const workflows = await workflowService.getWorkflows(projectId, req.user.id);
      res.json({ workflows });
    } catch (error) {
      console.error('Get workflows error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  createWorkflow: async (req, res) => {
    try {
      const { name, stages, projectId } = req.body;
      const workflow = await workflowService.createWorkflow({
        name,
        stages,
        projectId
      }, req.user.id);
      res.status(201).json({ workflow });
    } catch (error) {
      console.error('Create workflow error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  updateWorkflow: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, stages } = req.body;
      const workflow = await workflowService.updateWorkflow(id, { name, stages }, req.user.id);
      res.json({ workflow });
    } catch (error) {
      console.error('Update workflow error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  deleteWorkflow: async (req, res) => {
    try {
      const { id } = req.params;
      await workflowService.deleteWorkflow(id, req.user.id);
      res.json({ message: 'Workflow deleted' });
    } catch (error) {
      console.error('Delete workflow error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

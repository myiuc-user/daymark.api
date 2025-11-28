import { workflowService } from '../services/workflowService.js';

export const workflowController = {
  createWorkflowState: async (req, res) => {
    try {
      const { projectId, name, color, order } = req.body;
      const state = await workflowService.createWorkflowState(projectId, { name, color, order });
      res.status(201).json({ workflowState: state });
    } catch (error) {
      console.error('Create workflow state error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getWorkflowStates: async (req, res) => {
    try {
      const { projectId } = req.query;
      const states = await workflowService.getWorkflowStates(projectId);
      res.json({ workflowStates: states });
    } catch (error) {
      console.error('Get workflow states error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  updateWorkflowState: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, color, order } = req.body;
      const state = await workflowService.updateWorkflowState(id, { name, color, order });
      res.json({ workflowState: state });
    } catch (error) {
      console.error('Update workflow state error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteWorkflowState: async (req, res) => {
    try {
      const { id } = req.params;
      await workflowService.deleteWorkflowState(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete workflow state error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

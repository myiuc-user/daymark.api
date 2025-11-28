import { recurringTaskService } from '../services/recurringTaskService.js';

export const recurringTaskController = {
  createRecurringTask: async (req, res) => {
    try {
      const { projectId } = req.params;
      const task = await recurringTaskService.createRecurringTask(projectId, req.body);
      res.status(201).json({ task });
    } catch (error) {
      console.error('Create recurring task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getRecurringTasks: async (req, res) => {
    try {
      const { projectId } = req.params;
      const tasks = await recurringTaskService.getRecurringTasks(projectId);
      res.json({ tasks });
    } catch (error) {
      console.error('Get recurring tasks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateRecurringTask: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await recurringTaskService.updateRecurringTask(id, req.body);
      res.json({ task });
    } catch (error) {
      console.error('Update recurring task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteRecurringTask: async (req, res) => {
    try {
      const { id } = req.params;
      await recurringTaskService.deleteRecurringTask(id);
      res.json({ message: 'Recurring task deleted' });
    } catch (error) {
      console.error('Delete recurring task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

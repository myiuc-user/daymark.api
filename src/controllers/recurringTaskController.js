import { recurringTaskService } from '../services/recurringTaskService.js';

export const recurringTaskController = {
  createRecurringTask: async (req, res) => {
    try {
      const { projectId, title, description, frequency, dayOfWeek, dayOfMonth, nextDueDate } = req.body;
      
      const recurring = await recurringTaskService.createRecurringTask(projectId, {
        title,
        description,
        frequency,
        dayOfWeek,
        dayOfMonth,
        nextDueDate
      }, req.user.id);
      
      res.status(201).json({ recurringTask: recurring });
    } catch (error) {
      console.error('Create recurring task error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getRecurringTasks: async (req, res) => {
    try {
      const { projectId } = req.query;
      const recurring = await recurringTaskService.getRecurringTasks(projectId);
      res.json({ recurringTasks: recurring });
    } catch (error) {
      console.error('Get recurring tasks error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  updateRecurringTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, frequency, dayOfWeek, dayOfMonth } = req.body;
      
      const recurring = await recurringTaskService.updateRecurringTask(id, {
        title,
        description,
        frequency,
        dayOfWeek,
        dayOfMonth
      });
      
      res.json({ recurringTask: recurring });
    } catch (error) {
      console.error('Update recurring task error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteRecurringTask: async (req, res) => {
    try {
      const { id } = req.params;
      await recurringTaskService.deleteRecurringTask(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete recurring task error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

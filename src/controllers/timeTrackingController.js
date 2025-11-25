import { timeTrackingService } from '../services/timeTrackingService.js';

export const timeTrackingController = {
  getTimeEntries: async (req, res) => {
    try {
      const { taskId } = req.query;
      if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const entries = await timeTrackingService.getTimeEntries(taskId, req.user.id);
      res.json({ entries });
    } catch (error) {
      console.error('Get time entries error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  createTimeEntry: async (req, res) => {
    try {
      const { taskId, hours, description } = req.body;
      const entry = await timeTrackingService.createTimeEntry({
        taskId,
        hours,
        description,
        userId: req.user.id
      });
      res.status(201).json({ entry });
    } catch (error) {
      console.error('Create time entry error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  deleteTimeEntry: async (req, res) => {
    try {
      const { id } = req.params;
      await timeTrackingService.deleteTimeEntry(id, req.user.id);
      res.json({ message: 'Time entry deleted' });
    } catch (error) {
      console.error('Delete time entry error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

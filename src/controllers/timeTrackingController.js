import { timeTrackingService } from '../services/timeTrackingService.js';

export const timeTrackingController = {
  logTime: async (req, res) => {
    try {
      const { taskId, hours, description, date } = req.body;
      const entry = await timeTrackingService.logTime(taskId, {
        hours,
        description,
        date: date ? new Date(date) : new Date(),
        userId: req.user.id
      });
      res.status(201).json({ timeEntry: entry });
    } catch (error) {
      console.error('Log time error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getTimeEntries: async (req, res) => {
    try {
      const { taskId, projectId } = req.query;
      const entries = await timeTrackingService.getTimeEntries(taskId, projectId);
      res.json({ timeEntries: entries });
    } catch (error) {
      console.error('Get time entries error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getSummary: async (req, res) => {
    try {
      const { projectId } = req.query;
      const summary = await timeTrackingService.getSummary(projectId);
      res.json({ summary });
    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteTimeEntry: async (req, res) => {
    try {
      const { id } = req.params;
      await timeTrackingService.deleteTimeEntry(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete time entry error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

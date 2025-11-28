import { taskHistoryService } from '../services/taskHistoryService.js';

export const taskHistoryController = {
  getTaskHistory: async (req, res) => {
    try {
      const { taskId } = req.params;
      const history = await taskHistoryService.getTaskHistory(taskId);
      res.json({ history });
    } catch (error) {
      console.error('Get task history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

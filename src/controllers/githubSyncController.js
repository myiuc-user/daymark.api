import { githubSyncService } from '../services/githubSyncService.js';

export const githubSyncController = {
  syncIssues: async (req, res) => {
    try {
      const { projectId } = req.body;
      const syncedTasks = await githubSyncService.syncGitHubIssues(projectId, req.user.id);
      res.json({ syncedTasks, count: syncedTasks.length });
    } catch (error) {
      console.error('Sync issues error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  createIssue: async (req, res) => {
    try {
      const { taskId } = req.body;
      const issue = await githubSyncService.createGitHubIssueFromTask(taskId, req.user.id);
      res.json({ issue });
    } catch (error) {
      console.error('Create issue error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  updateIssue: async (req, res) => {
    try {
      const { taskId } = req.body;
      const issue = await githubSyncService.updateGitHubIssueFromTask(taskId, req.user.id);
      res.json({ issue });
    } catch (error) {
      console.error('Update issue error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

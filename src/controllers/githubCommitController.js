import { githubCommitService } from '../services/githubCommitService.js';

export const githubCommitController = {
  linkTaskToCommit: async (req, res) => {
    try {
      const { taskId, commitHash } = req.body;
      const result = await githubCommitService.linkTaskToCommit(taskId, commitHash, req.user.id);
      res.json({ task: result });
    } catch (error) {
      console.error('Link task to commit error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  updateCommitMessage: async (req, res) => {
    try {
      const { taskId } = req.body;
      const result = await githubCommitService.updateCommitMessage(taskId, req.user.id);
      res.json({ task: result });
    } catch (error) {
      console.error('Update commit message error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  unlinkTaskFromCommit: async (req, res) => {
    try {
      const { taskId } = req.body;
      const result = await githubCommitService.unlinkTaskFromCommit(taskId);
      res.json({ task: result });
    } catch (error) {
      console.error('Unlink task from commit error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getProjectCommits: async (req, res) => {
    try {
      const { projectId } = req.params;
      const commits = await githubCommitService.getProjectCommits(projectId, req.user.id);
      res.json({ commits });
    } catch (error) {
      console.error('Get project commits error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

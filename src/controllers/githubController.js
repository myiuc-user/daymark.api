import { githubService } from '../services/githubService.js';
import { githubAuthService } from '../services/githubAuthService.js';

export const githubController = {
  getUserRepos: async (req, res) => {
    try {
      const token = await githubAuthService.getUserToken(req.user.id);
      if (!token) {
        return res.status(401).json({ error: 'GitHub not connected' });
      }

      const repos = await githubService.getUserRepos(token);
      res.json({ repos });
    } catch (error) {
      console.error('Get user repos error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getRepoInfo: async (req, res) => {
    try {
      const { owner, repo } = req.query;
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      const info = await githubService.getRepoInfo(owner, repo, req.user?.githubToken);
      res.json({ info });
    } catch (error) {
      console.error('Get repo info error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getCodeMetrics: async (req, res) => {
    try {
      const { owner, repo } = req.query;
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      const metrics = await githubService.getCodeMetrics(owner, repo, req.user?.githubToken);
      res.json({ metrics });
    } catch (error) {
      console.error('Get code metrics error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  searchRepos: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const repos = await githubService.searchRepos(q, req.user?.githubToken);
      res.json({ repos });
    } catch (error) {
      console.error('Search repos error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

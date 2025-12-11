import { githubService } from '../services/githubService.js';

export const githubController = {
  // Auth endpoints
  getStatus: async (req, res) => {
    try {
      const connected = await githubService.hasUserToken(req.user.id);
      res.json({ connected });
    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getAuthUrl: async (req, res) => {
    try {
      const url = githubService.getAuthUrl();
      res.json({ authUrl: url });
    } catch (error) {
      console.error('Get auth URL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  handleCallback: async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      const token = await githubService.getAccessToken(code);
      const user = await githubService.getUserInfo(token);
      await githubService.saveUserToken(req.user.id, token, user);
      
      res.json({ 
        message: 'GitHub account connected successfully',
        user: { login: user.login, id: user.id, avatar_url: user.avatar_url }
      });
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  disconnectGithub: async (req, res) => {
    try {
      await githubService.removeUserToken(req.user.id);
      res.json({ message: 'GitHub account disconnected' });
    } catch (error) {
      console.error('Disconnect GitHub error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Repository endpoints
  getUserRepos: async (req, res) => {
    try {
      const token = await githubService.getUserToken(req.user.id);
      if (!token) {
        return res.status(401).json({ error: 'GitHub not connected' });
      }

      const repos = await githubService.getUserRepos(token);
      res.json(repos);
    } catch (error) {
      console.error('Get user repos error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getUserOrgs: async (req, res) => {
    try {
      const token = await githubService.getUserToken(req.user.id);
      if (!token) {
        return res.status(401).json({ error: 'GitHub not connected' });
      }

      const orgs = await githubService.getUserOrganizations(token);
      res.json(orgs);
    } catch (error) {
      console.error('Get user orgs error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getOrgRepos: async (req, res) => {
    try {
      const { org } = req.query;
      
      if (!org) {
        return res.status(400).json({ error: 'Organization name is required' });
      }

      const token = await githubService.getUserToken(req.user.id);
      if (!token) {
        return res.status(401).json({ error: 'GitHub not connected' });
      }

      const repos = await githubService.getOrganizationRepos(org, token);
      res.json(repos);
    } catch (error) {
      console.error('Get org repos error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getRepoInfo: async (req, res) => {
    try {
      const { owner, repo } = req.query;
      
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      const token = await githubService.getUserToken(req.user.id);
      const info = await githubService.getRepoInfo(owner, repo, token);
      res.json(info);
    } catch (error) {
      console.error('Get repo info error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getCodeMetrics: async (req, res) => {
    try {
      const { owner, repo } = req.query;
      
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      const token = await githubService.getUserToken(req.user.id);
      const metrics = await githubService.getCodeMetrics(owner, repo, token);
      res.json(metrics);
    } catch (error) {
      console.error('Get code metrics error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  searchRepos: async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const token = await githubService.getUserToken(req.user.id);
      const repos = await githubService.searchRepos(q, token);
      res.json(repos);
    } catch (error) {
      console.error('Search repos error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  // Commit endpoints
  getProjectCommits: async (req, res) => {
    try {
      const { projectId } = req.params;
      const commits = await githubService.getProjectCommits(projectId, req.user.id);
      res.json({ commits });
    } catch (error) {
      console.error('Get project commits error:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  linkTaskToCommit: async (req, res) => {
    try {
      const { taskId, commitHash } = req.body;
      const result = await githubService.linkTaskToCommit(taskId, commitHash, req.user.id);
      res.json({ task: result });
    } catch (error) {
      console.error('Link task to commit error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  updateCommitMessage: async (req, res) => {
    try {
      const { taskId } = req.body;
      const result = await githubService.updateCommitMessage(taskId, req.user.id);
      res.json({ task: result });
    } catch (error) {
      console.error('Update commit message error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  unlinkTaskFromCommit: async (req, res) => {
    try {
      const { taskId } = req.body;
      const result = await githubService.unlinkTaskFromCommit(taskId);
      res.json({ task: result });
    } catch (error) {
      console.error('Unlink task from commit error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Sync endpoints
  syncIssues: async (req, res) => {
    try {
      const { projectId } = req.body;
      const syncedTasks = await githubService.syncGitHubIssues(projectId, req.user.id);
      res.json({ syncedTasks, count: syncedTasks.length });
    } catch (error) {
      console.error('Sync issues error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  createIssue: async (req, res) => {
    try {
      const { taskId } = req.body;
      const issue = await githubService.createGitHubIssueFromTask(taskId, req.user.id);
      res.json({ issue });
    } catch (error) {
      console.error('Create issue error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  updateIssue: async (req, res) => {
    try {
      const { taskId } = req.body;
      const issue = await githubService.updateGitHubIssueFromTask(taskId, req.user.id);
      res.json({ issue });
    } catch (error) {
      console.error('Update issue error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

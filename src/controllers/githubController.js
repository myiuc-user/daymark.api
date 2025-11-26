import { githubService } from '../services/githubService.js';
import { githubAuthService } from '../services/githubAuthService.js';

export const githubController = {
  getUserRepos: async (req, res) => {
    try {
      console.log(`[GitHub] Getting repos for user: ${req.user.id}`);
      
      const token = await githubAuthService.getUserToken(req.user.id);
      if (!token) {
        console.log(`[GitHub] No token found for user: ${req.user.id}`);
        return res.status(401).json({ error: 'GitHub not connected' });
      }

      console.log(`[GitHub] Token found, fetching repos...`);
      const repos = await githubService.getUserRepos(token);
      console.log(`[GitHub] Successfully fetched ${repos.length} repos`);
      
      res.json(repos);
    } catch (error) {
      console.error(`[GitHub] Get user repos error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getUserOrgs: async (req, res) => {
    try {
      console.log(`[GitHub] Getting organizations for user: ${req.user.id}`);
      
      const token = await githubAuthService.getUserToken(req.user.id);
      if (!token) {
        return res.status(401).json({ error: 'GitHub not connected' });
      }

      const orgs = await githubService.getUserOrganizations(token);
      console.log(`[GitHub] Successfully fetched ${orgs.length} organizations`);
      
      res.json(orgs);
    } catch (error) {
      console.error(`[GitHub] Get user orgs error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getOrgRepos: async (req, res) => {
    try {
      const { org } = req.query;
      console.log(`[GitHub] Getting repos for organization: ${org}`);
      
      if (!org) {
        return res.status(400).json({ error: 'Organization name is required' });
      }

      const token = await githubAuthService.getUserToken(req.user.id);
      if (!token) {
        return res.status(401).json({ error: 'GitHub not connected' });
      }

      const repos = await githubService.getOrganizationRepos(org, token);
      console.log(`[GitHub] Successfully fetched ${repos.length} repos for org: ${org}`);
      
      res.json(repos);
    } catch (error) {
      console.error(`[GitHub] Get org repos error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getRepoInfo: async (req, res) => {
    try {
      const { owner, repo } = req.query;
      console.log(`[GitHub] Getting repo info: ${owner}/${repo}`);
      
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      const token = await githubAuthService.getUserToken(req.user.id);
      const info = await githubService.getRepoInfo(owner, repo, token);
      console.log(`[GitHub] Repo info:`, JSON.stringify(info, null, 2));
      
      res.json(info);
    } catch (error) {
      console.error(`[GitHub] Get repo info error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  },

  getCodeMetrics: async (req, res) => {
    try {
      const { owner, repo } = req.query;
      console.log(`[GitHub] Getting code metrics: ${owner}/${repo}`);
      
      if (!owner || !repo) {
        return res.status(400).json({ error: 'Owner and repo are required' });
      }

      const token = await githubAuthService.getUserToken(req.user.id);
      const metrics = await githubService.getCodeMetrics(owner, repo, token);
      console.log(`[GitHub] Code metrics:`, JSON.stringify(metrics, null, 2));
      
      res.json(metrics);
    } catch (error) {
      console.error(`[GitHub] Get code metrics error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  },

  searchRepos: async (req, res) => {
    try {
      const { q } = req.query;
      console.log(`[GitHub] Searching repos: ${q}`);
      
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const token = await githubAuthService.getUserToken(req.user.id);
      const repos = await githubService.searchRepos(q, token);
      console.log(`[GitHub] Found ${repos.length} repos for query: ${q}`);
      
      res.json(repos);
    } catch (error) {
      console.error(`[GitHub] Search repos error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  }
};

import express from 'express';
import { githubService } from '../services/githubService.js';
import { githubAuthService } from '../services/githubAuthService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get repository information
router.get('/repo/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const token = await githubAuthService.getUserToken(req.user.id);
    if (!token) {
      return res.status(401).json({ error: 'GitHub not connected' });
    }
    const repoInfo = await githubService.getRepoInfo(owner, repo, token);
    res.json(repoInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get code metrics and COCOMO estimation
router.get('/metrics/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { complexity = 'ORGANIC' } = req.query;
    const token = await githubAuthService.getUserToken(req.user.id);
    if (!token) {
      return res.status(401).json({ error: 'GitHub not connected' });
    }
    
    const [repoInfo, codeMetrics] = await Promise.all([
      githubService.getRepoInfo(owner, repo, token),
      githubService.getCodeMetrics(owner, repo, token)
    ]);
    
    const cocomo = githubService.calculateCOCOMO(codeMetrics.estimatedLOC, complexity);
    
    res.json({
      repository: repoInfo,
      codeMetrics,
      estimation: cocomo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent commits
router.get('/commits/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { since } = req.query;
    const token = await githubAuthService.getUserToken(req.user.id);
    if (!token) {
      return res.status(401).json({ error: 'GitHub not connected' });
    }
    
    const commits = await githubService.getCommits(owner, repo, token, since);
    res.json({ commits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
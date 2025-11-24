import express from 'express';
import { Octokit } from '@octokit/rest';

const router = express.Router();

// Test GitHub connectivity
router.get('/github-test', async (req, res) => {
  try {
    const octokit = new Octokit({
      request: {
        timeout: 10000,
        retries: 3
      }
    });
    
    // Test with a public repo
    const { data } = await octokit.rest.repos.get({
      owner: 'octocat',
      repo: 'Hello-World'
    });
    
    res.json({ 
      success: true, 
      message: 'GitHub API accessible',
      repo: data.name 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      code: error.code 
    });
  }
});

export default router;
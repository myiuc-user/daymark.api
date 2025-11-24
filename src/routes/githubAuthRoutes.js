import express from 'express';
import { githubAuthService } from '../services/githubAuthService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get GitHub OAuth URL
router.get('/auth-url', authenticateToken, async (req, res) => {
  try {
    const state = req.user.id; // Use user ID as state for security
    const authUrl = githubAuthService.getAuthUrl(state);
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback
router.post('/callback', authenticateToken, async (req, res) => {
  try {
    const { code, state } = req.body;

    if (state !== req.user.id) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const token = await githubAuthService.exchangeCodeForToken(code);
    const githubUser = await githubAuthService.getUserInfo(token);
    
    await githubAuthService.storeUserToken(req.user.id, token, githubUser);

    res.json({ 
      success: true, 
      githubUser: {
        login: githubUser.login,
        name: githubUser.name,
        avatar_url: githubUser.avatar_url
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get GitHub connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const token = await githubAuthService.getUserToken(req.user.id);
    res.json({ connected: !!token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect GitHub
router.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    await githubAuthService.storeUserToken(req.user.id, null, null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
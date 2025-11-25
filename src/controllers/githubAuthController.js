import { githubAuthService } from '../services/githubAuthService.js';

export const githubAuthController = {
  getAuthUrl: async (req, res) => {
    try {
      const url = githubAuthService.getAuthUrl();
      res.json({ url });
    } catch (error) {
      console.error('Get auth URL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  handleCallback: async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      const token = await githubAuthService.getAccessToken(code);
      const user = await githubAuthService.getUserInfo(token);
      
      await githubAuthService.saveUserToken(req.user.id, token, user);
      
      res.json({ 
        message: 'GitHub account connected successfully',
        user 
      });
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  disconnectGithub: async (req, res) => {
    try {
      await githubAuthService.removeUserToken(req.user.id);
      res.json({ message: 'GitHub account disconnected' });
    } catch (error) {
      console.error('Disconnect GitHub error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

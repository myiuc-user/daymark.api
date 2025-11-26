import { githubAuthService } from '../services/githubAuthService.js';

export const githubAuthController = {
  getStatus: async (req, res) => {
    try {
      console.log(`[GitHubAuth] Checking status for user: ${req.user.id}`);
      const connected = await githubAuthService.hasUserToken(req.user.id);
      console.log(`[GitHubAuth] Connected: ${connected}`);
      res.json({ connected });
    } catch (error) {
      console.error('Get status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getAuthUrl: async (req, res) => {
    try {
      console.log(`[GitHubAuth] Generating auth URL`);
      const url = githubAuthService.getAuthUrl();
      console.log(`[GitHubAuth] Auth URL: ${url}`);
      res.json({ authUrl: url });
    } catch (error) {
      console.error('Get auth URL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  handleCallback: async (req, res) => {
    try {
      const { code } = req.body;
      console.log(`[GitHubAuth] Handling callback for user: ${req.user.id}, code: ${code}`);
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      console.log(`[GitHubAuth] Exchanging code for token...`);
      const token = await githubAuthService.getAccessToken(code);
      console.log(`[GitHubAuth] Token received: ${token.substring(0, 10)}...`);
      
      console.log(`[GitHubAuth] Fetching user info...`);
      const user = await githubAuthService.getUserInfo(token);
      console.log(`[GitHubAuth] User info: ${JSON.stringify(user, null, 2)}`);
      
      console.log(`[GitHubAuth] Saving token for user: ${req.user.id}`);
      await githubAuthService.saveUserToken(req.user.id, token, user);
      console.log(`[GitHubAuth] Token saved successfully`);
      
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
      console.log(`[GitHubAuth] Disconnecting GitHub for user: ${req.user.id}`);
      await githubAuthService.removeUserToken(req.user.id);
      console.log(`[GitHubAuth] GitHub disconnected`);
      res.json({ message: 'GitHub account disconnected' });
    } catch (error) {
      console.error('Disconnect GitHub error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

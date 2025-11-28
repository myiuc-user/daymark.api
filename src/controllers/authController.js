import { 
  authenticateUser, 
  generateTokens, 
  getCurrentUser, 
  verifyRefreshToken 
} from '../services/authService.js';
import { validateRequest, loginSchema } from '../utils/validation.js';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await authenticateUser(email, password);
      const { accessToken, refreshToken } = generateTokens(user.id);

      res.cookie('refreshToken', refreshToken, getCookieOptions());

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message || 'Invalid credentials' });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await getCurrentUser(req.user.id);
      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  refresh: async (req, res) => {
    try {
      let refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        refreshToken = req.body.refreshToken;
      }
      
      if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token', redirect: '/login' });
      }

      const decoded = verifyRefreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

      res.cookie('refreshToken', newRefreshToken, getCookieOptions());

      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.error('Refresh token error:', error.message);
      res.status(401).json({ error: 'Invalid refresh token', redirect: '/login' });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

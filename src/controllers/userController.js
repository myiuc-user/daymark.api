import { userService } from '../services/userService.js';

export const userController = {
  searchUsers: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const users = await userService.searchUsers(q);
      res.json({ users });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

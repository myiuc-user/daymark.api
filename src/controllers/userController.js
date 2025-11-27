import { userService } from '../services/userService.js';
import { imageService } from '../services/imageService.js';
import path from 'path';

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
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      if (id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const user = await userService.updateProfile(id, req.body);
      res.json({ user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { id } = req.params;
      if (id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old and new passwords are required' });
      }
      await userService.updatePassword(id, oldPassword, newPassword);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  uploadProfilePhoto: async (req, res) => {
    try {
      const { id } = req.params;
      if (id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const compressedPath = await imageService.compressProfilePhoto(req.file.path);
      const photoUrl = `/uploads/profiles/${path.basename(compressedPath)}`;
      
      const user = await userService.updateProfilePhoto(id, photoUrl);
      res.json({ user, message: 'Profile photo updated successfully' });
    } catch (error) {
      console.error('Upload profile photo error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload photo' });
    }
  }
};

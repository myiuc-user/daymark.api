import { adminService } from '../services/adminService.js';
import { requireSuperAdmin } from '../middleware/auth.js';

export const adminController = {
  getUsers: async (req, res) => {
    try {
      const users = await adminService.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createUser: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const user = await adminService.createUser({ name, email, password, role });
      res.status(201).json({ user });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await adminService.updateUserRole(id, role);
      res.json({ user });
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const user = await adminService.updateUserStatus(id, isActive);
      res.json({ user });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      await adminService.deleteUser(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

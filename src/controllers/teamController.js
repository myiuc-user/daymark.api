import { teamService } from '../services/teamService.js';

export const teamController = {
  getTeams: async (req, res) => {
    try {
      const { workspaceId } = req.query;
      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required' });
      }

      const teams = await teamService.getTeams(workspaceId, req.user.id);
      res.json({ teams });
    } catch (error) {
      console.error('Get teams error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  createTeam: async (req, res) => {
    try {
      const { name, description, workspaceId } = req.body;
      const team = await teamService.createTeam({ name, description, workspaceId }, req.user.id);
      res.status(201).json({ team });
    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  getTeam: async (req, res) => {
    try {
      const { id } = req.params;
      const team = await teamService.getTeamById(id);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      res.json({ team });
    } catch (error) {
      console.error('Get team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateTeam: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const team = await teamService.updateTeam(id, { name, description }, req.user.id);
      res.json({ team });
    } catch (error) {
      console.error('Update team error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  deleteTeam: async (req, res) => {
    try {
      const { id } = req.params;
      await teamService.deleteTeam(id, req.user.id);
      res.json({ message: 'Team deleted' });
    } catch (error) {
      console.error('Delete team error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

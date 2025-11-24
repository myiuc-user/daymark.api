import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { teamService } from '../services/teamService.js';

const router = express.Router();

// POST /api/teams/invite
router.post('/invite', authenticateToken, async (req, res) => {
  try {
    const { workspaceId, email, role } = req.body;
    const invitation = await teamService.inviteToWorkspace(
      workspaceId, 
      email, 
      role, 
      req.user.id
    );
    res.status(201).json(invitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams/accept-invitation
router.post('/accept-invitation', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const result = await teamService.acceptInvitation(token);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/teams/project-role
router.post('/project-role', authenticateToken, async (req, res) => {
  try {
    const { projectId, userId, role } = req.body;
    const member = await teamService.assignProjectRole(projectId, userId, role);
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/teams/assign-multiple
router.post('/assign-multiple', authenticateToken, async (req, res) => {
  try {
    const { taskId, userIds } = req.body;
    const task = await teamService.assignMultipleToTask(taskId, userIds);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
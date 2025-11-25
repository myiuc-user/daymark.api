import { invitationService } from '../services/invitationService.js';

export const invitationController = {
  cancelInvitation: async (req, res) => {
    try {
      const { id } = req.params;
      await invitationService.cancelInvitation(id, req.user.id);
      res.json({ message: 'Invitation cancelled successfully' });
    } catch (error) {
      console.error('Cancel invitation error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Failed to cancel invitation' });
    }
  }
};

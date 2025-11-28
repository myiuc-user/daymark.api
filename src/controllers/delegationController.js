import { delegationService } from '../services/delegationService.js';
import prisma from '../config/prisma.js';

export const delegationController = {
  delegate: async (req, res) => {
    try {
      const { toUserId, workspaceId, projectId, permissions, expiresAt } = req.body;

      if (!toUserId || !permissions || !expiresAt) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!workspaceId && !projectId) {
        return res.status(400).json({ error: 'Either workspaceId or projectId is required' });
      }

      const delegation = await delegationService.delegatePermissions(
        req.user.id,
        toUserId,
        workspaceId,
        projectId,
        permissions,
        new Date(expiresAt)
      );

      res.status(201).json({ delegation });
    } catch (error) {
      console.error('Delegation error:', error);
      res.status(500).json({ error: 'Failed to delegate permissions' });
    }
  },

  getDelegations: async (req, res) => {
    try {
      const { workspaceId, projectId } = req.query;
      const delegations = await delegationService.getDelegations(workspaceId, projectId);
      res.json({ delegations });
    } catch (error) {
      console.error('Get delegations error:', error);
      res.status(500).json({ error: 'Failed to fetch delegations' });
    }
  },

  revoke: async (req, res) => {
    try {
      const { id } = req.params;
      const delegation = await prisma.permissionDelegation.findUnique({ where: { id } });

      if (!delegation) {
        return res.status(404).json({ error: 'Delegation not found' });
      }

      if (delegation.fromUserId !== req.user.id) {
        return res.status(403).json({ error: 'Only the delegator can revoke' });
      }

      await delegationService.revokeDelegation(id);
      res.json({ message: 'Delegation revoked' });
    } catch (error) {
      console.error('Revoke delegation error:', error);
      res.status(500).json({ error: 'Failed to revoke delegation' });
    }
  },

  getMyDelegations: async (req, res) => {
    try {
      const delegations = await delegationService.getUserDelegations(req.user.id);
      res.json({ delegations });
    } catch (error) {
      console.error('Get my delegations error:', error);
      res.status(500).json({ error: 'Failed to fetch delegations' });
    }
  }
};

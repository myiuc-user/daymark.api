import { auditService } from '../services/auditService.js';

export const auditController = {
  getAuditLogs: async (req, res) => {
    try {
      const { entity, entityId, action } = req.query;
      const filters = {};
      if (entity) filters.entity = entity;
      if (entityId) filters.entityId = entityId;
      if (action) filters.action = action;

      const logs = await auditService.getAuditLogs(filters);
      res.json({ logs });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getEntityHistory: async (req, res) => {
    try {
      const { entity, entityId } = req.params;
      const history = await auditService.getEntityHistory(entity, entityId);
      res.json({ history });
    } catch (error) {
      console.error('Get entity history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

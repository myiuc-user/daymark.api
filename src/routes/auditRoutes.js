import express from 'express';
import { auditService } from '../services/auditService.js';
import { taskService } from '../services/taskService.js';
import { auditMiddleware } from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(auditMiddleware);

// Get audit logs with filters
router.get('/logs', async (req, res) => {
  try {
    const { entity, entityId, userId, action, startDate, endDate, limit, offset } = req.query;
    const result = await auditService.getAuditLogs({
      entity,
      entityId,
      userId,
      action,
      startDate,
      endDate,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get entity history
router.get('/history/:entity/:entityId', async (req, res) => {
  try {
    const { entity, entityId } = req.params;
    const history = await auditService.getEntityHistory(entity, entityId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task history
router.get('/task-history/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const history = await taskService.getTaskHistory(taskId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

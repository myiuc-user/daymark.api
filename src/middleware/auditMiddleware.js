import { auditService } from '../services/auditService.js';
import { taskHistoryService } from '../services/taskHistoryService.js';

export const auditMiddleware = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (req.method !== 'GET' && req.user && res.statusCode < 400) {
      const action = getActionFromMethod(req.method, req.path);
      let entity = getEntityFromPath(req.path);
      let entityId = getEntityIdFromPath(req.path);

      if (req.method === 'POST' && data?.task?.id) {
        entity = 'TASK';
        entityId = data.task.id;
      } else if (req.method === 'POST' && data?.project?.id) {
        entity = 'PROJECT';
        entityId = data.project.id;
      }

      if (entity && entityId) {
        auditService.logAction(
          req.user.id,
          action,
          entity,
          entityId,
          req.body
        ).catch(err => console.error('Audit logging error:', err));
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

function getActionFromMethod(method, path) {
  if (method === 'POST') return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return 'UNKNOWN';
}

function getEntityFromPath(path) {
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    const entity = segments[segments.length - 2] || segments[0];
    return entity.replace(/s$/, '').toUpperCase();
  }
  return null;
}

function getEntityIdFromPath(path) {
  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (lastSegment && !isNaN(lastSegment) || /^[0-9a-f-]{36}$/.test(lastSegment)) {
    return lastSegment;
  }
  return null;
}

export const recordTaskChange = async (taskId, changes, userId) => {
  await taskHistoryService.recordMultipleChanges(taskId, changes, userId);
};

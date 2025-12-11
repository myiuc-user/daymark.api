import { auditService } from '../services/auditService.js';

const AUDITABLE_ENTITIES = {
  'projects': 'PROJECT',
  'tasks': 'TASK',
  'workspaces': 'WORKSPACE',
  'sprints': 'SPRINT',
  'milestones': 'MILESTONE',
  'workflows': 'WORKFLOW',
  'templates': 'TEMPLATE',
  'teams': 'TEAM',
  'delegations': 'DELEGATION',
  'comments': 'COMMENT',
  'files': 'FILE',
  'time-entries': 'TIME_ENTRY',
};

export const auditMiddleware = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (req.method !== 'GET' && req.user && res.statusCode < 400) {
      const action = getActionFromMethod(req.method);
      const { entity, entityId } = extractEntityInfo(req.path, req.method, data);

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

function getActionFromMethod(method) {
  if (method === 'POST') return 'CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return 'UNKNOWN';
}

function extractEntityInfo(path, method, data) {
  const segments = path.split('/').filter(Boolean);
  
  // Try to extract from response data first
  for (const [key, entity] of Object.entries(AUDITABLE_ENTITIES)) {
    if (data?.[key.replace(/-/g, '_')]?.id) {
      return { entity, entityId: data[key.replace(/-/g, '_')].id };
    }
    // Try singular form
    const singular = key.slice(0, -1);
    if (data?.[singular]?.id) {
      return { entity, entityId: data[singular].id };
    }
  }

  // Extract from path
  let entity = null;
  let entityId = null;

  for (const [pathKey, entityName] of Object.entries(AUDITABLE_ENTITIES)) {
    if (segments.includes(pathKey)) {
      entity = entityName;
      const keyIndex = segments.indexOf(pathKey);
      if (keyIndex + 1 < segments.length) {
        const nextSegment = segments[keyIndex + 1];
        if (/^[0-9a-f-]{36}$/.test(nextSegment) || !isNaN(nextSegment)) {
          entityId = nextSegment;
        }
      }
      break;
    }
  }

  return { entity, entityId };
}

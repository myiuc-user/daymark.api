import prisma from '../config/prisma.js';

export const auditService = {
  logAction: async (userId, action, entity, entityId, changes = {}) => {
    try {
      return await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          changes
        },
        include: { user: { select: { id: true, name: true, email: true } } }
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  },

  getAuditLogs: async (filters = {}) => {
    const { entity, entityId, userId, action, startDate, endDate, limit = 50, offset = 0 } = filters;
    
    const where = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.auditLog.count({ where })
    ]);

    return { logs, total, limit, offset };
  },

  getEntityHistory: async (entity, entityId) => {
    return await prisma.auditLog.findMany({
      where: { entity, entityId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }
};

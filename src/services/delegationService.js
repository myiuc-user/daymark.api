import prisma from '../config/prisma.js';

export const delegationService = {
  delegatePermissions: async (fromUserId, toUserId, workspaceId, projectId, permissions, expiresAt) => {
    return await prisma.permissionDelegation.create({
      data: {
        fromUserId,
        toUserId,
        workspaceId,
        projectId,
        permissions,
        expiresAt
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } }
      }
    });
  },

  getDelegations: async (workspaceId, projectId) => {
    const where = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (projectId) where.projectId = projectId;
    where.expiresAt = { gt: new Date() };

    return await prisma.permissionDelegation.findMany({
      where,
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } }
      }
    });
  },

  revokeDelegation: async (delegationId) => {
    return await prisma.permissionDelegation.delete({
      where: { id: delegationId }
    });
  },

  getUserDelegations: async (userId) => {
    return await prisma.permissionDelegation.findMany({
      where: {
        toUserId: userId,
        expiresAt: { gt: new Date() }
      },
      include: {
        fromUser: { select: { id: true, name: true, email: true } }
      }
    });
  }
};

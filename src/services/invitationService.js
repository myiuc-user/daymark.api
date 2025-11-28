import prisma from '../config/prisma.js';
import { hasRoleOrHigher } from '../utils/permissions.js';

export const invitationService = {
  cancelInvitation: async (id, userId, userRole = '') => {
    const isSuperAdmin = userRole?.toUpperCase?.() === 'SUPER_ADMIN';

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id },
      include: { workspace: true }
    });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (isSuperAdmin) {
      return await prisma.workspaceInvitation.delete({
        where: { id }
      });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: invitation.workspaceId },
      include: {
        members: {
          where: { userId },
          select: { role: true }
        }
      }
    });

    const isOwner = workspace.ownerId === userId;
    const userMember = workspace.members[0];
    const isAdmin = userMember && hasRoleOrHigher(userMember.role, 'ADMIN');

    if (!isOwner && !isAdmin) {
      throw new Error('Access denied');
    }

    return await prisma.workspaceInvitation.delete({
      where: { id }
    });
  }
};

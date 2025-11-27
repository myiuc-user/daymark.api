import prisma from '../config/prisma.js';

export const invitationService = {
  cancelInvitation: async (id, userId) => {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id },
      include: { workspace: true }
    });

    if (!invitation) {
      throw new Error('Invitation not found');
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
    const isAdmin = workspace.members.some(m => m.role === 'ADMIN');

    if (!isOwner && !isAdmin) {
      throw new Error('Access denied');
    }

    return await prisma.workspaceInvitation.delete({
      where: { id }
    });
  }
};

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const teamService = {
  getTeams: async (workspaceId, userId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: { where: { userId } } }
    });

    if (!workspace || (workspace.ownerId !== userId && workspace.members.length === 0)) {
      throw new Error('Access denied');
    }

    return await prisma.team.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  createTeam: async (data, userId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: data.workspaceId },
      include: { members: { where: { userId } } }
    });

    if (!workspace || (workspace.ownerId !== userId && workspace.members.length === 0)) {
      throw new Error('Access denied');
    }

    return await prisma.team.create({
      data,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
  },

  getTeamById: async (id) => {
    return await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
  },

  updateTeam: async (id, data, userId) => {
    const team = await prisma.team.findUnique({
      where: { id },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!team || (team.workspace.ownerId !== userId && team.workspace.members.length === 0)) {
      throw new Error('Access denied');
    }

    return await prisma.team.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
  },

  deleteTeam: async (id, userId) => {
    const team = await prisma.team.findUnique({
      where: { id },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!team || (team.workspace.ownerId !== userId && team.workspace.members.length === 0)) {
      throw new Error('Access denied');
    }

    return await prisma.team.delete({
      where: { id }
    });
  }
};

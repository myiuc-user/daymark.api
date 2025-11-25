import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const collaborationService = {
  getCollaborations: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.collaboration.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
  },

  createCollaboration: async (data, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.collaboration.create({
      data,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
  },

  deleteCollaboration: async (id, userId) => {
    const collaboration = await prisma.collaboration.findUnique({
      where: { id },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!collaboration || (collaboration.project.workspace.ownerId !== userId && collaboration.project.workspace.members.length === 0 && collaboration.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.collaboration.delete({
      where: { id }
    });
  }
};

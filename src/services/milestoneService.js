import prisma from '../config/prisma.js';

export const milestoneService = {
  getMilestones: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' }
    });
  },

  createMilestone: async (data, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.milestone.create({
      data: {
        ...data,
        dueDate: new Date(data.dueDate)
      }
    });
  },

  updateMilestone: async (id, data, userId) => {
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!milestone || (milestone.project.workspace.ownerId !== userId && milestone.project.workspace.members.length === 0 && milestone.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.milestone.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined
      }
    });
  },

  deleteMilestone: async (id, userId) => {
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!milestone || (milestone.project.workspace.ownerId !== userId && milestone.project.workspace.members.length === 0 && milestone.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.milestone.delete({
      where: { id }
    });
  }
};

import prisma from '../config/prisma.js';

export const sprintService = {
  getSprints: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.sprint.findMany({
      where: { projectId },
      orderBy: { startDate: 'desc' }
    });
  },

  createSprint: async (data, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.sprint.create({
      data: {
        name: data.name,
        goal: data.goal,
        projectId: data.projectId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'PLANNED'
      }
    });
  },

  updateSprint: async (id, data, userId) => {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!sprint || (sprint.project.workspace.ownerId !== userId && sprint.project.workspace.members.length === 0 && sprint.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.sprint.update({
      where: { id },
      data: {
        name: data.name,
        goal: data.goal,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status
      }
    });
  },

  deleteSprint: async (id, userId) => {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!sprint || (sprint.project.workspace.ownerId !== userId && sprint.project.workspace.members.length === 0 && sprint.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.sprint.delete({
      where: { id }
    });
  },

  activateSprint: async (id, userId) => {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!sprint || (sprint.project.workspace.ownerId !== userId && sprint.project.workspace.members.length === 0 && sprint.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    // Deactivate all other sprints in the project
    await prisma.sprint.updateMany({
      where: { projectId: sprint.projectId, status: 'ACTIVE' },
      data: { status: 'PLANNED' }
    });

    // Activate the selected sprint
    return await prisma.sprint.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });
  }
};

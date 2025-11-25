import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const workflowService = {
  getWorkflows: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.workflow.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  },

  createWorkflow: async (data, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: { workspace: { include: { members: { where: { userId } } } } }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0 && project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.workflow.create({
      data
    });
  },

  updateWorkflow: async (id, data, userId) => {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!workflow || (workflow.project.workspace.ownerId !== userId && workflow.project.workspace.members.length === 0 && workflow.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.workflow.update({
      where: { id },
      data
    });
  },

  deleteWorkflow: async (id, userId) => {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { project: { include: { workspace: { include: { members: { where: { userId } } } } } } }
    });

    if (!workflow || (workflow.project.workspace.ownerId !== userId && workflow.project.workspace.members.length === 0 && workflow.project.team_lead !== userId)) {
      throw new Error('Access denied');
    }

    return await prisma.workflow.delete({
      where: { id }
    });
  }
};

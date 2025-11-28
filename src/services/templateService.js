import prisma from '../config/prisma.js';

export const templateService = {
  createTemplate: async (data) => {
    return await prisma.projectTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        data: {
          workflowStates: data.workflowStates || [],
          taskTemplate: data.taskTemplate || {},
          settings: data.settings || {}
        },
        isPublic: data.isPublic || false,
        createdById: data.createdById
      }
    });
  },

  createTemplateFromProject: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workflowStates: true,
        tasks: true
      }
    });

    if (!project) throw new Error('Project not found');

    const priorities = [...new Set(project.tasks.map(t => t.priority))];
    const statuses = [...new Set(project.tasks.map(t => t.status))];

    return await prisma.projectTemplate.create({
      data: {
        name: `${project.name} Template`,
        description: `Template based on ${project.name}`,
        data: {
          workflowStates: project.workflowStates.map(s => ({ name: s.name, color: s.color })),
          taskDefaults: {
            priorities,
            statuses
          },
          settings: {
            status: project.status
          }
        },
        isPublic: false,
        createdById: userId
      }
    });
  },

  getTemplates: async (userId) => {
    return await prisma.projectTemplate.findMany({
      where: {
        OR: [
          { createdById: userId },
          { isPublic: true }
        ]
      },
      include: { createdBy: { select: { name: true } } }
    });
  },

  useTemplate: async (templateId, projectName, userId) => {
    const template = await prisma.projectTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) throw new Error('Template not found');

    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: userId }
    });

    if (!workspace) throw new Error('Workspace not found');

    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: template.description,
        workspaceId: workspace.id,
        team_lead: userId,
        status: template.data.settings?.status || 'ACTIVE'
      }
    });

    if (template.data.workflowStates?.length > 0) {
      for (let i = 0; i < template.data.workflowStates.length; i++) {
        const state = template.data.workflowStates[i];
        await prisma.workflowState.create({
          data: {
            projectId: project.id,
            name: state.name,
            color: state.color,
            order: i
          }
        });
      }
    }

    return project;
  },

  deleteTemplate: async (templateId) => {
    return await prisma.projectTemplate.delete({
      where: { id: templateId }
    });
  }
};

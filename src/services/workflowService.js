import prisma from '../config/prisma.js';

export const workflowService = {
  createWorkflowState: async (projectId, data) => {
    return await prisma.workflowState.create({
      data: {
        projectId,
        name: data.name,
        color: data.color || '#gray',
        order: data.order || 0
      }
    });
  },

  getWorkflowStates: async (projectId) => {
    return await prisma.workflowState.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    });
  },

  updateWorkflowState: async (stateId, data) => {
    return await prisma.workflowState.update({
      where: { id: stateId },
      data: {
        name: data.name,
        color: data.color,
        order: data.order
      }
    });
  },

  deleteWorkflowState: async (stateId) => {
    const state = await prisma.workflowState.findUnique({
      where: { id: stateId },
      include: { tasks: true }
    });

    if (state?.tasks.length > 0) {
      await prisma.task.updateMany({
        where: { workflowStateId: stateId },
        data: { workflowStateId: null }
      });
    }

    return await prisma.workflowState.delete({
      where: { id: stateId }
    });
  },

  updateTaskWorkflowState: async (taskId, workflowStateId) => {
    const state = await prisma.workflowState.findUnique({
      where: { id: workflowStateId }
    });

    if (!state) throw new Error('Workflow state not found');

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { workflowStateId }
    });

    return task;
  },

  initializeProjectWorkflow: async (projectId) => {
    const defaultStates = [
      { name: 'TODO', color: '#gray', order: 0 },
      { name: 'IN_PROGRESS', color: '#blue', order: 1 },
      { name: 'DONE', color: '#green', order: 2 }
    ];

    for (const state of defaultStates) {
      await prisma.workflowState.create({
        data: {
          projectId,
          ...state
        }
      });
    }
  },

  getTaskWorkflowState: async (taskId) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { workflowState: true }
    });

    return task?.workflowState || null;
  },

  isTaskCompleted: async (taskId) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { workflowState: true }
    });

    if (!task) return false;

    if (task.workflowState) {
      return task.workflowState.name.toUpperCase() === 'DONE';
    }

    return task.status === 'DONE';
  }
};

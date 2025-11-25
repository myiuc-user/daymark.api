import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const templateService = {
  getTemplates: async (userId) => {
    return await prisma.template.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  createTemplate: async (data) => {
    return await prisma.template.create({
      data
    });
  },

  deleteTemplate: async (id, userId) => {
    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template || template.createdById !== userId) {
      throw new Error('Access denied');
    }

    return await prisma.template.delete({
      where: { id }
    });
  }
};

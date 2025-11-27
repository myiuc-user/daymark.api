import prisma from '../config/prisma.js';

export const fileService = {
  uploadFile: async (file, userId) => {
    return await prisma.file.create({
      data: {
        name: file.originalname,
        url: file.path,
        size: file.size,
        mimeType: file.mimetype,
        uploadedById: userId
      }
    });
  },

  listProjectFiles: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!project || (project.workspace.ownerId !== userId && project.workspace.members.length === 0)) {
      throw new Error('Access denied');
    }

    return await prisma.file.findMany({
      where: { projectId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  deleteFile: async (id, userId) => {
    const file = await prisma.file.findUnique({
      where: { id }
    });

    if (!file || file.uploadedById !== userId) {
      throw new Error('Access denied');
    }

    return await prisma.file.delete({
      where: { id }
    });
  }
};

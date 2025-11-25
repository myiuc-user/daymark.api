import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

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

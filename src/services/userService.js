import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const userService = {
  searchUsers: async (query) => {
    return await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      take: 10
    });
  },

  getUserById: async (id) => {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true
      }
    });
  },

  updateProfile: async (id, data) => {
    const { name, image } = data;
    return await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(image && { image })
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    });
  },

  updatePassword: async (id, oldPassword, newPassword) => {
    const bcrypt = await import('bcryptjs');
    const user = await prisma.user.findUnique({ where: { id } });
    
    const isValid = await bcrypt.default.compare(oldPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    const hashedPassword = await bcrypt.default.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
  },

  updateProfilePhoto: async (id, photoUrl) => {
    return await prisma.user.update({
      where: { id },
      data: { image: photoUrl },
      select: {
        id: true,
        email: true,
        name: true,
        image: true
      }
    });
  }
};

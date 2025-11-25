import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';

export const adminService = {
  getAllUsers: async () => {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  createUser: async (data) => {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'MEMBER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
  },

  updateUserRole: async (id, role) => {
    return await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
  },

  updateUserStatus: async (id, isActive) => {
    return await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
  },

  deleteUser: async (id) => {
    return await prisma.user.delete({
      where: { id }
    });
  }
};

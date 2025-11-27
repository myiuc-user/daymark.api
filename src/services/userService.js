import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import { hasPermission, ROLE_PERMISSIONS } from '../utils/permissions.js';

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
    const user = await prisma.user.findUnique({ where: { id } });
    
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
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
  },

  getUserPermissions: async (userId, context = null) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return [];

    // If context provided (projectId or workspaceId), get contextual permissions
    if (context?.projectId) {
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: context.projectId,
            userId
          }
        },
        select: { role: true }
      });
      return projectMember ? ROLE_PERMISSIONS[projectMember.role] || [] : [];
    }

    if (context?.workspaceId) {
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: context.workspaceId,
            userId
          }
        },
        select: { role: true }
      });
      return workspaceMember ? ROLE_PERMISSIONS[workspaceMember.role] || [] : [];
    }

    return ROLE_PERMISSIONS[user.role] || [];
  },

  canPerformAction: async (userId, permission, context = null) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return false;

    // Super admin can do everything
    if (user.role === 'SUPER_ADMIN') return true;

    // Check contextual permissions
    if (context?.projectId) {
      const projectMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: context.projectId,
            userId
          }
        },
        select: { role: true }
      });
      return projectMember ? hasPermission(projectMember.role, permission) : false;
    }

    if (context?.workspaceId) {
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: context.workspaceId,
            userId
          }
        },
        select: { role: true }
      });
      return workspaceMember ? hasPermission(workspaceMember.role, permission) : false;
    }

    return hasPermission(user.role, permission);
  }
};

import prisma from '../config/prisma.js';
import { hasPermission, PERMISSIONS } from '../utils/permissions.js';

export const permissionService = {
  // Check if user has permission in workspace context
  hasWorkspacePermission: async (userId, workspaceId, permission) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      },
      select: { role: true }
    });

    return member ? hasPermission(member.role, permission) : false;
  },

  // Check if user has permission in project context
  hasProjectPermission: async (userId, projectId, permission) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      },
      select: { role: true }
    });

    return member ? hasPermission(member.role, permission) : false;
  },

  // Get user's role in workspace
  getWorkspaceRole: async (userId, workspaceId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role === 'SUPER_ADMIN') return 'SUPER_ADMIN';

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      },
      select: { role: true }
    });

    return member?.role || null;
  },

  // Get user's role in project
  getProjectRole: async (userId, projectId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role === 'SUPER_ADMIN') return 'SUPER_ADMIN';

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      },
      select: { role: true }
    });

    return member?.role || null;
  },

  // Get all permissions for user in workspace
  getWorkspacePermissions: async (userId, workspaceId) => {
    const role = await permissionService.getWorkspaceRole(userId, workspaceId);
    if (!role) return [];

    const { ROLE_PERMISSIONS } = await import('../utils/permissions.js');
    return ROLE_PERMISSIONS[role] || [];
  },

  // Get all permissions for user in project
  getProjectPermissions: async (userId, projectId) => {
    const role = await permissionService.getProjectRole(userId, projectId);
    if (!role) return [];

    const { ROLE_PERMISSIONS } = await import('../utils/permissions.js');
    return ROLE_PERMISSIONS[role] || [];
  },

  // Check if user can perform multiple actions (any)
  hasAnyPermission: async (userId, projectId, permissions) => {
    return Promise.all(
      permissions.map(perm => 
        permissionService.hasProjectPermission(userId, projectId, perm)
      )
    ).then(results => results.some(r => r));
  },

  // Check if user can perform multiple actions (all)
  hasAllPermissions: async (userId, projectId, permissions) => {
    return Promise.all(
      permissions.map(perm => 
        permissionService.hasProjectPermission(userId, projectId, perm)
      )
    ).then(results => results.every(r => r));
  }
};

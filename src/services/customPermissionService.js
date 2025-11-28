import prisma from '../config/prisma.js';

const AVAILABLE_PERMISSIONS = [
  'CREATE_TASK',
  'EDIT_TASK',
  'DELETE_TASK',
  'ASSIGN_TASK',
  'VIEW_ANALYTICS',
  'MANAGE_MEMBERS',
  'MANAGE_WORKFLOW',
  'MANAGE_SPRINTS',
  'MANAGE_TEMPLATES'
];

export const customPermissionService = {
  getProjectMemberPermissions: async (projectMemberId) => {
    const member = await prisma.projectMember.findUnique({
      where: { id: projectMemberId }
    });

    if (!member) return [];
    return member.customPermissions || [];
  },

  getWorkspaceMemberPermissions: async (workspaceMemberId) => {
    const member = await prisma.workspaceMember.findUnique({
      where: { id: workspaceMemberId }
    });

    if (!member) return [];
    return member.customPermissions || [];
  },

  setProjectMemberPermissions: async (projectMemberId, permissions) => {
    const validPermissions = permissions.filter(p => AVAILABLE_PERMISSIONS.includes(p));

    return await prisma.projectMember.update({
      where: { id: projectMemberId },
      data: { customPermissions: validPermissions }
    });
  },

  setWorkspaceMemberPermissions: async (workspaceMemberId, permissions) => {
    const validPermissions = permissions.filter(p => AVAILABLE_PERMISSIONS.includes(p));

    return await prisma.workspaceMember.update({
      where: { id: workspaceMemberId },
      data: { customPermissions: validPermissions }
    });
  },

  hasPermission: async (userId, projectId, permission) => {
    const projectMember = await prisma.projectMember.findFirst({
      where: { userId, projectId }
    });

    if (!projectMember) return false;

    if (projectMember.customPermissions?.includes(permission)) {
      return true;
    }

    const rolePermissions = {
      'ADMIN': AVAILABLE_PERMISSIONS,
      'MEMBER': ['CREATE_TASK', 'EDIT_TASK', 'ASSIGN_TASK'],
      'VIEWER': []
    };

    return rolePermissions[projectMember.role]?.includes(permission) || false;
  },

  getAvailablePermissions: () => AVAILABLE_PERMISSIONS
};

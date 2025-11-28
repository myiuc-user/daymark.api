import { ROLE_HIERARCHY, hasRoleOrHigher, PERMISSIONS } from './permissions.js';

/**
 * Permission system documentation:
 * 
 * ROLE HIERARCHY:
 * - VIEWER (1): Read-only access
 * - MEMBER (2): Can create and modify content
 * - ADMIN (3): Can manage members and settings
 * 
 * EFFECTIVE ROLE:
 * When a user has both workspace and project roles, the higher role is used.
 * Example: VIEWER at workspace + ADMIN at project = ADMIN (effective)
 * 
 * PERMISSION CHECKS:
 * 1. SUPER_ADMIN: Always has all permissions
 * 2. Workspace/Project Owner: Always has all permissions
 * 3. Team Lead: Always has all permissions
 * 4. Assignee/Creator: Can access their own tasks
 * 5. Role-based: Check effective role against required role
 */

export const getEffectiveRole = (projectRole, workspaceRole) => {
  const pRole = projectRole || 'VIEWER';
  const wRole = workspaceRole || 'VIEWER';
  return ROLE_HIERARCHY[pRole] >= ROLE_HIERARCHY[wRole] ? pRole : wRole;
};

export const canManageMembers = (userRole) => {
  return hasRoleOrHigher(userRole, 'ADMIN');
};

export const canCreateContent = (userRole) => {
  return hasRoleOrHigher(userRole, 'MEMBER');
};

export const canReadContent = (userRole) => {
  return hasRoleOrHigher(userRole, 'VIEWER');
};

export const canDeleteContent = (userRole) => {
  return hasRoleOrHigher(userRole, 'ADMIN');
};

export const canUpdateContent = (userRole) => {
  return hasRoleOrHigher(userRole, 'MEMBER');
};

export const canComment = (userRole) => {
  return hasRoleOrHigher(userRole, 'VIEWER');
};

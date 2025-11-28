// Role hierarchy
export const ROLE_HIERARCHY = { 'VIEWER': 1, 'MEMBER': 2, 'ADMIN': 3, 'SUPER_ADMIN': 4 };

// Valid roles
export const VALID_WORKSPACE_ROLES = ['VIEWER', 'MEMBER', 'ADMIN'];
export const VALID_PROJECT_ROLES = ['VIEWER', 'MEMBER', 'ADMIN'];

// Permission definitions by role and context
export const PERMISSIONS = {
  WORKSPACE: {
    CREATE: 'workspace:create',
    READ: 'workspace:read',
    UPDATE: 'workspace:update',
    DELETE: 'workspace:delete',
    MANAGE_MEMBERS: 'workspace:manage_members',
    MANAGE_ROLES: 'workspace:manage_roles'
  },
  PROJECT: {
    CREATE: 'project:create',
    READ: 'project:read',
    UPDATE: 'project:update',
    DELETE: 'project:delete',
    MANAGE_MEMBERS: 'project:manage_members',
    MANAGE_SETTINGS: 'project:manage_settings'
  },
  TASK: {
    CREATE: 'task:create',
    READ: 'task:read',
    UPDATE: 'task:update',
    DELETE: 'task:delete',
    ASSIGN: 'task:assign',
    COMMENT: 'task:comment'
  },
  SPRINT: {
    CREATE: 'sprint:create',
    READ: 'sprint:read',
    UPDATE: 'sprint:update',
    DELETE: 'sprint:delete',
    ACTIVATE: 'sprint:activate'
  },
  TEMPLATE: {
    CREATE: 'template:create',
    READ: 'template:read',
    UPDATE: 'template:update',
    DELETE: 'template:delete'
  }
};

// Role-based permission mapping
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS).flatMap(perms => Object.values(perms)),
  ADMIN: [
    // Workspace
    PERMISSIONS.WORKSPACE.READ,
    PERMISSIONS.WORKSPACE.UPDATE,
    PERMISSIONS.WORKSPACE.MANAGE_MEMBERS,
    PERMISSIONS.WORKSPACE.MANAGE_ROLES,
    // Project
    PERMISSIONS.PROJECT.CREATE,
    PERMISSIONS.PROJECT.READ,
    PERMISSIONS.PROJECT.UPDATE,
    PERMISSIONS.PROJECT.DELETE,
    PERMISSIONS.PROJECT.MANAGE_MEMBERS,
    PERMISSIONS.PROJECT.MANAGE_SETTINGS,
    // Task
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.READ,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.DELETE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.COMMENT,
    // Sprint
    PERMISSIONS.SPRINT.CREATE,
    PERMISSIONS.SPRINT.READ,
    PERMISSIONS.SPRINT.UPDATE,
    PERMISSIONS.SPRINT.DELETE,
    PERMISSIONS.SPRINT.ACTIVATE,
    // Template
    PERMISSIONS.TEMPLATE.CREATE,
    PERMISSIONS.TEMPLATE.READ,
    PERMISSIONS.TEMPLATE.UPDATE,
    PERMISSIONS.TEMPLATE.DELETE
  ],
  MEMBER: [
    // Workspace
    PERMISSIONS.WORKSPACE.READ,
    // Project
    PERMISSIONS.PROJECT.READ,
    PERMISSIONS.PROJECT.UPDATE,
    PERMISSIONS.PROJECT.MANAGE_MEMBERS,
    // Task
    PERMISSIONS.TASK.CREATE,
    PERMISSIONS.TASK.READ,
    PERMISSIONS.TASK.UPDATE,
    PERMISSIONS.TASK.ASSIGN,
    PERMISSIONS.TASK.COMMENT,
    // Sprint
    PERMISSIONS.SPRINT.READ,
    // Template
    PERMISSIONS.TEMPLATE.READ
  ],
  VIEWER: [
    // Workspace
    PERMISSIONS.WORKSPACE.READ,
    // Project
    PERMISSIONS.PROJECT.READ,
    // Task
    PERMISSIONS.TASK.READ,
    PERMISSIONS.TASK.COMMENT,
    // Sprint
    PERMISSIONS.SPRINT.READ,
    // Template
    PERMISSIONS.TEMPLATE.READ
  ]
};

export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(perm => hasPermission(userRole, perm));
};

export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(perm => hasPermission(userRole, perm));
};

export const hasRoleOrHigher = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

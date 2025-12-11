import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { hasPermission, ROLE_PERMISSIONS } from '../utils/permissionHelpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads/profiles');

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

  compressProfilePhoto: async (filePath) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileName = path.basename(filePath);
      const tempPath = path.join(uploadDir, `temp-${Date.now()}.jpg`);
      const outputPath = path.join(uploadDir, fileName);
      
      await sharp(filePath)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80, progressive: true })
        .toFile(tempPath);

      await fs.unlink(filePath);
      await fs.rename(tempPath, outputPath);
      
      return outputPath;
    } catch (error) {
      throw new Error(`Image compression failed: ${error.message}`);
    }
  },

  deleteProfilePhoto: async (filePath) => {
    try {
      if (filePath && filePath.startsWith('/uploads/')) {
        const fullPath = path.join(process.cwd(), filePath);
        await fs.unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  },

  getProjectPermissions: async (userId, projectId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return [];

    if (user.role === 'SUPER_ADMIN') return ROLE_PERMISSIONS['SUPER_ADMIN'] || [];

    const projectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      },
      select: { role: true }
    });

    return projectMember ? ROLE_PERMISSIONS[projectMember.role] || [] : [];
  },

  getWorkspacePermissions: async (userId, workspaceId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return [];

    if (user.role === 'SUPER_ADMIN') return ROLE_PERMISSIONS['SUPER_ADMIN'] || [];

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      },
      select: { role: true }
    });

    return workspaceMember ? ROLE_PERMISSIONS[workspaceMember.role] || [] : [];
  },

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

  hasAnyPermission: async (userId, projectId, permissions) => {
    return Promise.all(
      permissions.map(perm => 
        userService.hasProjectPermission(userId, projectId, perm)
      )
    ).then(results => results.some(r => r));
  },

  hasAllPermissions: async (userId, projectId, permissions) => {
    return Promise.all(
      permissions.map(perm => 
        userService.hasProjectPermission(userId, projectId, perm)
      )
    ).then(results => results.every(r => r));
  },

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

  getAvailablePermissions: () => AVAILABLE_PERMISSIONS,

  getUserPermissions: async (userId, context = null) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return [];

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

    if (user.role === 'SUPER_ADMIN') return true;

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
  },

  exportUserData: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'SUPER_ADMIN') {
      throw new Error('Only SUPER_ADMIN can export all data');
    }

    const [users, workspaces, projects, tasks, comments, files, notifications, milestones, sprints, timeEntries, templates, workflowStates, taskWatchers, mentions, projectMembers, workspaceMembers, workspaceInvitations, permissionDelegations, auditLogs, taskHistories, taskDependencies, notificationPreferences, recurringTasks] = await Promise.all([
      prisma.user.findMany(),
      prisma.workspace.findMany({ include: { members: true, projects: true } }),
      prisma.project.findMany({ include: { members: true, tasks: true } }),
      prisma.task.findMany({ include: { subtasks: true, comments: true, timeEntries: true, watchers: true } }),
      prisma.comment.findMany(),
      prisma.file.findMany(),
      prisma.notification.findMany(),
      prisma.milestone.findMany(),
      prisma.sprint.findMany(),
      prisma.timeEntry.findMany(),
      prisma.projectTemplate.findMany(),
      prisma.workflowState.findMany(),
      prisma.taskWatcher.findMany(),
      prisma.mention.findMany(),
      prisma.projectMember.findMany(),
      prisma.workspaceMember.findMany(),
      prisma.workspaceInvitation.findMany(),
      prisma.permissionDelegation.findMany(),
      prisma.auditLog.findMany(),
      prisma.taskHistory.findMany(),
      prisma.taskDependency.findMany(),
      prisma.notificationPreference.findMany(),
      prisma.recurringTask.findMany(),
    ]);

    return {
      exportDate: new Date().toISOString(),
      exportedBy: userId,
      data: {
        users,
        workspaces,
        projects,
        tasks,
        comments,
        files,
        notifications,
        milestones,
        sprints,
        timeEntries,
        templates,
        workflowStates,
        taskWatchers,
        mentions,
        projectMembers,
        workspaceMembers,
        workspaceInvitations,
        permissionDelegations,
        auditLogs,
        taskHistories,
        taskDependencies,
        notificationPreferences,
        recurringTasks,
      },
    };
  },

  importUserData: async (userId, importData) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: [],
    };

    try {
      if (importData.data?.ownedWorkspaces?.length) {
        for (const workspace of importData.data.ownedWorkspaces) {
          try {
            const existingWorkspace = await prisma.workspace.findFirst({
              where: {
                name: workspace.name,
                ownerId: userId,
              },
            });

            if (existingWorkspace) {
              results.errors.push(`Workspace "${workspace.name}" already exists, skipping`);
              continue;
            }

            const newWorkspace = await prisma.workspace.create({
              data: {
                name: workspace.name,
                slug: `${workspace.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                description: workspace.description,
                ownerId: userId,
                members: {
                  create: {
                    userId,
                    role: 'ADMIN',
                  },
                },
              },
            });

            if (workspace.members?.length) {
              for (const member of workspace.members) {
                try {
                  const existingMember = await prisma.workspaceMember.findFirst({
                    where: {
                      workspaceId: newWorkspace.id,
                      userId: member.userId,
                    },
                  });

                  if (!existingMember && member.userId !== userId) {
                    await prisma.workspaceMember.create({
                      data: {
                        workspaceId: newWorkspace.id,
                        userId: member.userId,
                        role: member.role || 'MEMBER',
                      },
                    });
                  }
                } catch (error) {
                  results.errors.push(`Failed to import workspace member: ${error.message}`);
                }
              }
            }

            if (workspace.projects?.length) {
              for (const project of workspace.projects) {
                try {
                  const newProject = await prisma.project.create({
                    data: {
                      name: project.name,
                      description: project.description,
                      workspaceId: newWorkspace.id,
                      status: project.status || 'ACTIVE',
                      team_lead: userId,
                    },
                  });

                  if (project.tasks?.length) {
                    for (const task of project.tasks) {
                      try {
                        const newTask = await prisma.task.create({
                          data: {
                            title: task.title,
                            description: task.description,
                            projectId: newProject.id,
                            status: task.status || 'TODO',
                            priority: task.priority || 'MEDIUM',
                            storyPoints: task.storyPoints,
                            due_date: task.due_date ? new Date(task.due_date) : new Date(),
                            assigneeId: userId,
                            createdById: userId,
                          },
                        });

                        if (task.subtasks?.length) {
                          for (const subtask of task.subtasks) {
                            await prisma.task.create({
                              data: {
                                title: subtask.title,
                                projectId: newProject.id,
                                status: subtask.status || 'TODO',
                                priority: 'MEDIUM',
                                due_date: new Date(),
                                assigneeId: userId,
                                createdById: userId,
                                parentTaskId: newTask.id,
                              },
                            });
                          }
                        }

                        results.imported++;
                      } catch (error) {
                        results.failed++;
                        results.errors.push(`Failed to import task: ${error.message}`);
                      }
                    }
                  }

                  results.imported++;
                } catch (error) {
                  results.failed++;
                  results.errors.push(`Failed to import project: ${error.message}`);
                }
              }
            }

            results.imported++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to import workspace: ${error.message}`);
          }
        }
      }

      if (importData.data?.memberWorkspaces?.length) {
        for (const memberWorkspace of importData.data.memberWorkspaces) {
          try {
            const workspace = await prisma.workspace.findUnique({
              where: { id: memberWorkspace.workspaceId }
            });

            if (workspace) {
              const existingMember = await prisma.workspaceMember.findFirst({
                where: {
                  workspaceId: workspace.id,
                  userId: userId,
                }
              });

              if (!existingMember) {
                await prisma.workspaceMember.create({
                  data: {
                    workspaceId: workspace.id,
                    userId: userId,
                    role: memberWorkspace.role || 'MEMBER',
                  },
                });
                results.imported++;
              }
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to import member workspace: ${error.message}`);
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  },
};

import prisma from '../config/prisma.js';

export const dataExportService = {
  exportUserData: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedWorkspaces: {
          include: {
            members: true,
            projects: {
              include: {
                tasks: {
                  include: {
                    subtasks: true,
                    comments: true,
                    timeEntries: true,
                    watchers: true,
                  },
                },
                sprints: true,
                milestones: true,
                workflowStates: true,
              },
            },
          },
        },
        comments: true,
        mentions: true,
        watchedTasks: true,
        timeEntries: true,
        notifications: true,
        notificationPreference: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      data: {
        workspaces: user.ownedWorkspaces,
        comments: user.comments,
        mentions: user.mentions,
        watchedTasks: user.watchedTasks,
        timeEntries: user.timeEntries,
        notifications: user.notifications,
        notificationPreference: user.notificationPreference,
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
      if (importData.data?.workspaces?.length) {
        for (const workspace of importData.data.workspaces) {
          try {
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

      return results;
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  },
};

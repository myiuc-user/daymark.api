import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { notificationService } from './notificationService.js';

const prisma = new PrismaClient();

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  start() {
    // Check for due tasks every hour
    this.jobs.set('dueTasks', cron.schedule('0 * * * *', async () => {
      await this.checkDueTasks();
    }));

    // Daily project progress report
    this.jobs.set('dailyReport', cron.schedule('0 9 * * *', async () => {
      await this.sendDailyReports();
    }));

    // Clean old notifications weekly
    this.jobs.set('cleanNotifications', cron.schedule('0 0 * * 0', async () => {
      await this.cleanOldNotifications();
    }));

    console.log('✅ Cron jobs started');
  }

  async checkDueTasks() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dueTasks = await prisma.task.findMany({
        where: {
          due_date: {
            lte: tomorrow
          },
          status: {
            not: 'DONE'
          }
        },
        include: {
          assignee: true,
          project: {
            include: {
              workspace: true
            }
          }
        }
      });

      for (const task of dueTasks) {
        await notificationService.sendToUser(task.assigneeId, {
          type: 'TASK_DUE',
          title: 'Task Due Soon',
          message: `Task "${task.title}" is due ${task.due_date.toLocaleDateString()}`,
          data: {
            taskId: task.id,
            projectId: task.projectId,
            dueDate: task.due_date
          }
        });
      }

      console.log(`Checked ${dueTasks.length} due tasks`);
    } catch (error) {
      console.error('Due tasks check error:', error);
    }
  }

  async sendDailyReports() {
    try {
      const workspaces = await prisma.workspace.findMany({
        include: {
          owner: true,
          projects: {
            include: {
              tasks: true
            }
          }
        }
      });

      for (const workspace of workspaces) {
        const totalTasks = workspace.projects.reduce((sum, p) => sum + p.tasks.length, 0);
        const completedTasks = workspace.projects.reduce(
          (sum, p) => sum + p.tasks.filter(t => t.status === 'DONE').length, 0
        );

        await notificationService.sendToUser(workspace.ownerId, {
          type: 'DAILY_REPORT',
          title: 'Daily Progress Report',
          message: `${workspace.name}: ${completedTasks}/${totalTasks} tasks completed`,
          data: {
            workspaceId: workspace.id,
            totalTasks,
            completedTasks,
            completionRate: totalTasks ? (completedTasks / totalTasks * 100).toFixed(1) : 0
          }
        });
      }
    } catch (error) {
      console.error('Daily report error:', error);
    }
  }

  async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          read: true
        }
      });

      console.log(`Cleaned ${deleted.count} old notifications`);
    } catch (error) {
      console.error('Notification cleanup error:', error);
    }
  }

  stop() {
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }
}

export const cronService = new CronService();
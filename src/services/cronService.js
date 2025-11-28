import cron from 'node-cron';
import prisma from '../config/prisma.js';
import { notificationService } from './notificationService.js';
import { recurringTaskService } from './recurringTaskService.js';

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  start() {
    this.jobs.set('dueTasks', cron.schedule('0 * * * *', async () => {
      try {
        await this.checkDueTasks();
      } catch (error) {
        console.error('Due tasks check error:', error.message);
      }
    }));

    this.jobs.set('dailyReport', cron.schedule('0 9 * * *', async () => {
      try {
        await this.sendDailyReports();
      } catch (error) {
        console.error('Daily report error:', error.message);
      }
    }));

    this.jobs.set('cleanNotifications', cron.schedule('0 0 * * 0', async () => {
      try {
        await this.cleanOldNotifications();
      } catch (error) {
        console.error('Notification cleanup error:', error.message);
      }
    }));

    this.jobs.set('recurringTasks', cron.schedule('0 0 * * *', async () => {
      try {
        await this.executeRecurringTasks();
      } catch (error) {
        console.error('Recurring tasks execution error:', error.message);
      }
    }));

    console.log('✅ Cron jobs started');
  }

  async checkDueTasks() {
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
      if (task.assigneeId) {
        await notificationService.sendToUser(task.assigneeId, {
          type: 'TASK_DUE',
          title: 'Task Due Soon',
          message: `Task "${task.title}" is due ${task.due_date.toLocaleDateString()}`,
          relatedId: task.id,
          relatedType: 'task'
        });
      }
    }

    console.log(`Checked ${dueTasks.length} due tasks`);
  }

  async sendDailyReports() {
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
        relatedId: workspace.id,
        relatedType: 'workspace'
      });
    }
  }

  async cleanOldNotifications() {
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
  }

  async executeRecurringTasks() {
    await recurringTaskService.executeRecurringTasks();
    console.log('Executed recurring tasks');
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

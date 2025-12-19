import { Injectable } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class CronService {
  private jobs = new Map<string, cron.ScheduledTask>();

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private tasksService: TasksService
  ) {}

  start() {
    this.jobs.set('dueTasks', cron.schedule('0 * * * *', () => this.checkDueTasks()));
    this.jobs.set('dailyReport', cron.schedule('0 9 * * *', () => this.sendDailyReports()));
    this.jobs.set('cleanNotifications', cron.schedule('0 0 * * 0', () => this.cleanOldNotifications()));
    this.jobs.set('recurringTasks', cron.schedule('0 0 * * *', () => this.executeRecurringTasks()));
    console.log('✅ Cron jobs started');
  }

  private async checkDueTasks() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dueTasks = await this.prisma.task.findMany({
        where: {
          due_date: { lte: tomorrow },
          status: { not: 'DONE' }
        },
        include: {
          assignee: true,
          project: { include: { workspace: true } }
        }
      });

      for (const task of dueTasks) {
        if (task.assigneeId) {
          await this.notificationsService.sendToUser(task.assigneeId, {
            type: 'TASK_DUE',
            title: 'Task Due Soon',
            message: `Task "${task.title}" is due ${task.due_date.toLocaleDateString()}`,
            relatedId: task.id,
            relatedType: 'task'
          });
        }
      }

      console.log(`Checked ${dueTasks.length} due tasks`);
    } catch (error) {
      console.error('Due tasks check error:', error instanceof Error ? error.message : String(error));
    }
  }

  private async sendDailyReports() {
    try {
      const workspaces = await this.prisma.workspace.findMany({
        include: {
          owner: true,
          projects: { include: { tasks: true } }
        }
      });

      for (const workspace of workspaces) {
        const totalTasks = workspace.projects.reduce((sum, p) => sum + p.tasks.length, 0);
        const completedTasks = workspace.projects.reduce(
          (sum, p) => sum + p.tasks.filter(t => t.status === 'DONE').length,
          0
        );

        await this.notificationsService.sendToUser(workspace.ownerId, {
          type: 'DAILY_REPORT',
          title: 'Daily Progress Report',
          message: `${workspace.name}: ${completedTasks}/${totalTasks} tasks completed`,
          relatedId: workspace.id,
          relatedType: 'workspace'
        });
      }
    } catch (error) {
      console.error('Daily report error:', error instanceof Error ? error.message : String(error));
    }
  }

  private async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await this.prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          read: true
        }
      });

      console.log(`Cleaned ${deleted.count} old notifications`);
    } catch (error) {
      console.error('Notification cleanup error:', error instanceof Error ? error.message : String(error));
    }
  }

  private async executeRecurringTasks() {
    try {
      await this.tasksService.executeRecurringTasks();
      console.log('Executed recurring tasks');
    } catch (error) {
      console.error('Recurring tasks execution error:', error instanceof Error ? error.message : String(error));
    }
  }

  stop() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }
}

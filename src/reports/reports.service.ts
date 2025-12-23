import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async createScheduledReport(data: any) {
    const nextRunAt = this.calculateNextRun(data.cronExpression);
    return this.prisma.scheduledReport.create({
      data: {
        ...data,
        nextRunAt
      }
    });
  }

  async getScheduledReports(userId: string) {
    return this.prisma.scheduledReport.findMany({
      where: { createdById: userId },
      include: {
        executions: {
          take: 5,
          orderBy: { executedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateScheduledReport(id: string, data: any) {
    return this.prisma.scheduledReport.update({
      where: { id },
      data
    });
  }

  async deleteScheduledReport(id: string) {
    return this.prisma.scheduledReport.delete({
      where: { id }
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async executeScheduledReports() {
    const now = new Date();
    const dueReports = await this.prisma.scheduledReport.findMany({
      where: {
        isActive: true,
        OR: [
          { nextRunAt: { lte: now } },
          { nextRunAt: null }
        ]
      }
    });

    for (const report of dueReports) {
      await this.executeReport(report.id);
    }
  }

  async executeReport(reportId: string, isManual: boolean = false) {
    const report = await this.prisma.scheduledReport.findUnique({
      where: { id: reportId }
    });

    if (!report) throw new BadRequestException('Report not found');

    const execution = await this.prisma.reportExecution.create({
      data: {
        scheduledReportId: reportId,
        status: 'RUNNING',
        recipients: report.recipients,
        executedById: report.createdById
      }
    });

    try {
      const reportData = await this.generateReportData(report);
      
      // Envoyer l'email avec le rapport
      if (report.recipients && report.recipients.length > 0) {
        await this.emailService.sendReportEmail(
          report.recipients,
          report.name,
          report.description || '',
          report.reportType
        );
      }
      
      await this.prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          filePath: 'generated-report.pdf'
        }
      });

      // Ne mettre à jour nextRunAt que si ce n'est pas une exécution manuelle
      const updateData: any = { lastRunAt: new Date() };
      if (!isManual) {
        updateData.nextRunAt = this.calculateNextRun(report.cronExpression);
      }
      
      await this.prisma.scheduledReport.update({
        where: { id: reportId },
        data: updateData
      });

    } catch (error) {
      await this.prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }

  private async generateReportData(report: any) {
    switch (report.reportType) {
      case 'TASK_SUMMARY':
        return this.getTaskSummaryData(report);
      case 'USER_PERFORMANCE':
        return this.getUserPerformanceData(report);
      case 'PROJECT_PROGRESS':
        return this.getProjectProgressData(report);
      default:
        return {};
    }
  }

  private async getTaskSummaryData(report: any) {
    const filters = report.filters || {};
    const dateRange = parseInt(filters.dateRange || '7');
    
    return this.prisma.task.findMany({
      where: {
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.userIds?.length > 0 && { assigneeId: { in: filters.userIds } }),
        createdAt: {
          gte: new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        assignee: true,
        project: true
      }
    });
  }

  private async getUserPerformanceData(report: any) {
    const filters = report.filters || {};
    const dateRange = parseInt(filters.dateRange || '7');
    const dateFilter = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    
    return this.prisma.user.findMany({
      where: {
        ...(filters.userIds?.length > 0 && { id: { in: filters.userIds } })
      },
      include: {
        tasks: {
          where: {
            ...(filters.projectId && { projectId: filters.projectId }),
            updatedAt: { gte: dateFilter }
          }
        },
        timeEntries: {
          where: {
            date: { gte: dateFilter }
          }
        }
      }
    });
  }

  private async getProjectProgressData(report: any) {
    const filters = report.filters || {};
    
    return this.prisma.project.findMany({
      where: filters.projectId ? { id: filters.projectId } : {},
      include: {
        tasks: {
          where: {
            ...(filters.userIds?.length > 0 && { assigneeId: { in: filters.userIds } })
          }
        },
        members: {
          where: {
            ...(filters.userIds?.length > 0 && { userId: { in: filters.userIds } })
          },
          include: { user: true }
        }
      }
    });
  }

  private calculateNextRun(cronExpression: string): Date {
    const now = new Date();
    
    if (cronExpression.includes('daily')) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    
    if (cronExpression.includes('weekly')) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  async executeReportManually(reportId: string) {
    return this.executeReport(reportId, true);
  }

  async getReportExecutions(reportId: string) {
    return this.prisma.reportExecution.findMany({
      where: { scheduledReportId: reportId },
      orderBy: { executedAt: 'desc' },
      take: 20
    });
  }
}
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
    return this.prisma.scheduledReport.create({
      data
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
    const dueReports = await this.prisma.scheduledReport.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: new Date() }
      }
    });

    for (const report of dueReports) {
      await this.executeReport(report.id);
    }
  }

  async executeReport(reportId: string) {
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
      
      await this.prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          filePath: 'generated-report.pdf'
        }
      });

      const nextRunAt = this.calculateNextRun(report.cronExpression);
      await this.prisma.scheduledReport.update({
        where: { id: reportId },
        data: { 
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRun(report.cronExpression)
        }
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
    return this.prisma.task.findMany({
      where: {
        ...(report.projectId && { projectId: report.projectId }),
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        assignee: true,
        project: true
      }
    });
  }

  private async getUserPerformanceData(report: any) {
    return this.prisma.user.findMany({
      include: {
        tasks: {
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        timeEntries: {
          where: {
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });
  }

  private async getProjectProgressData(report: any) {
    return this.prisma.project.findMany({
      where: report.projectId ? { id: report.projectId } : {},
      include: {
        tasks: true,
        members: {
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

  async getReportExecutions(reportId: string) {
    return this.prisma.reportExecution.findMany({
      where: { scheduledReportId: reportId },
      orderBy: { executedAt: 'desc' },
      take: 20
    });
  }
}
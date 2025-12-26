import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { FilesService } from '../files/files.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as cron from 'node-cron';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private filesService: FilesService
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
      const reportStats = await this.generateReportStats(report, reportData);
      
      // Pour TASK_SUMMARY, utiliser reportData comme tasks, sinon récupérer les tâches
      const filtersObj = typeof report.filters === 'object' && report.filters !== null && !Array.isArray(report.filters) ? report.filters as Record<string, any> : {};
      const dateRangeStr = typeof filtersObj.dateRange === 'string' ? filtersObj.dateRange : '7';
      const tasksForPDF = report.reportType === 'TASK_SUMMARY' ? reportData : 
        await this.getTasksForStats(filtersObj, new Date(Date.now() - parseInt(dateRangeStr) * 24 * 60 * 60 * 1000));
      
      const pdfPath = await this.generatePDF(report, reportStats, tasksForPDF);
      
      // Télécharger le PDF depuis MinIO pour l'attachement
      const pdfStream = await this.filesService.getFileStream(pdfPath);
      const pdfBuffer = await this.streamToBuffer(pdfStream);
      
      // Envoyer l'email avec le rapport et les statistiques
      if (report.recipients && report.recipients.length > 0) {
        await this.emailService.sendReportEmail(
          report.recipients,
          report.name,
          report.description || '',
          report.reportType,
          reportStats,
          pdfBuffer,
          tasksForPDF
        );
      }
      
      await this.prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          filePath: pdfPath
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
        return [];
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
    // Utiliser le fuseau horaire GMT+1 (Afrique de l'ouest et centre)
    const now = new Date();
    const gmtPlus1Now = new Date(now.getTime() + (1 * 60 * 60 * 1000)); // GMT+1
    
    // Valider l'expression cron
    if (!cron.validate(cronExpression)) {
      throw new BadRequestException('Invalid cron expression');
    }
    
    // Calculer la prochaine exécution en GMT+1
    const nextRun = new Date(gmtPlus1Now);
    nextRun.setSeconds(0, 0); // Reset seconds and milliseconds
    
    // Incrémenter d'une minute pour commencer la recherche
    nextRun.setMinutes(nextRun.getMinutes() + 1);
    
    // Chercher la prochaine date valide (max 366 jours)
    for (let i = 0; i < 366 * 24 * 60; i++) {
      if (this.matchesCron(nextRun, cronExpression)) {
        // Convertir de GMT+1 vers UTC pour le stockage
        return new Date(nextRun.getTime() - (1 * 60 * 60 * 1000));
      }
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    }
    
    // Fallback si aucune date trouvée
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
  
  private matchesCron(date: Date, cronExpression: string): boolean {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return false;
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    return (
      this.matchesCronField(date.getMinutes(), minute) &&
      this.matchesCronField(date.getHours(), hour) &&
      this.matchesCronField(date.getDate(), dayOfMonth) &&
      this.matchesCronField(date.getMonth() + 1, month) &&
      this.matchesCronField(date.getDay(), dayOfWeek)
    );
  }
  
  private matchesCronField(value: number, field: string): boolean {
    if (field === '*') return true;
    
    // Handle ranges (e.g., 1-5)
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      return value >= start && value <= end;
    }
    
    // Handle steps (e.g., */5)
    if (field.includes('/')) {
      const [range, step] = field.split('/');
      const stepNum = Number(step);
      if (range === '*') {
        return value % stepNum === 0;
      }
    }
    
    // Handle lists (e.g., 1,3,5)
    if (field.includes(',')) {
      return field.split(',').map(Number).includes(value);
    }
    
    // Handle single value
    return Number(field) === value;
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }

  private async generateReportStats(report: any, reportData: any) {
    const filters = typeof report.filters === 'object' && report.filters !== null && !Array.isArray(report.filters) ? report.filters as Record<string, any> : {};
    const dateRangeStr = typeof filters.dateRange === 'string' ? filters.dateRange : '7';
    const dateRange = parseInt(dateRangeStr);
    const dateFilter = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;
    
    // Calculer les statistiques selon le type de rapport
    if (report.reportType === 'TASK_SUMMARY') {
      // reportData contient directement les tâches
      totalTasks = Array.isArray(reportData) ? reportData.length : 0;
      completedTasks = Array.isArray(reportData) ? 
        reportData.filter(task => task.status === 'DONE').length : 0;
      inProgressTasks = Array.isArray(reportData) ? 
        reportData.filter(task => task.status === 'IN_PROGRESS').length : 0;
      todoTasks = Array.isArray(reportData) ? 
        reportData.filter(task => task.status === 'TODO').length : 0;
    } else {
      // Pour USER_PERFORMANCE et PROJECT_PROGRESS, récupérer les tâches séparément
      const tasks = await this.getTasksForStats(filters, dateFilter);
      totalTasks = tasks.length;
      completedTasks = tasks.filter(task => task.status === 'DONE').length;
      inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS').length;
      todoTasks = tasks.filter(task => task.status === 'TODO').length;
    }
    
    // Statistiques par utilisateur (si applicable)
    const userStats = await this.getUserStats(filters, dateFilter);
    
    // Statistiques par projet (si applicable)
    const projectStats = await this.getProjectStats(filters, dateFilter);
    
    return {
      period: `${dateRange} derniers jours`,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      userStats,
      projectStats,
      generatedAt: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Lagos' })
    };
  }
  
  private async getTasksForStats(filters: any, dateFilter: Date) {
    return this.prisma.task.findMany({
      where: {
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.userIds?.length > 0 && { assigneeId: { in: filters.userIds } }),
        updatedAt: { gte: dateFilter }
      },
      include: {
        assignee: true,
        project: true
      }
    });
  }
  
  private async getUserStats(filters: any, dateFilter: Date) {
    const whereClause: any = {
      tasks: {
        some: {
          updatedAt: { gte: dateFilter },
          ...(filters.projectId && { projectId: filters.projectId })
        }
      }
    };
    
    if (filters.userIds?.length > 0) {
      whereClause.id = { in: filters.userIds };
    }
    
    const users = await this.prisma.user.findMany({
      where: whereClause,
      include: {
        tasks: {
          where: {
            updatedAt: { gte: dateFilter },
            ...(filters.projectId && { projectId: filters.projectId })
          }
        }
      }
    });
    
    return users.map(user => ({
      name: user.name,
      totalTasks: user.tasks.length,
      completedTasks: user.tasks.filter(t => t.status === 'DONE').length,
      inProgressTasks: user.tasks.filter(t => t.status === 'IN_PROGRESS').length
    }));
  }
  
  private async getProjectStats(filters: any, dateFilter: Date) {
    const whereClause: any = {};
    
    if (filters.projectId) {
      whereClause.id = filters.projectId;
    }
    
    const projects = await this.prisma.project.findMany({
      where: whereClause,
      include: {
        tasks: {
          where: {
            updatedAt: { gte: dateFilter },
            ...(filters.userIds?.length > 0 && { assigneeId: { in: filters.userIds } })
          }
        }
      }
    });
    
    return projects.map(project => ({
      name: project.name,
      totalTasks: project.tasks.length,
      completedTasks: project.tasks.filter(t => t.status === 'DONE').length,
      inProgressTasks: project.tasks.filter(t => t.status === 'IN_PROGRESS').length
    }));
  }

  private async generatePDF(report: any, stats: any, tasks: any = []): Promise<string> {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      
      const page = await browser.newPage();
      
      const htmlContent = this.emailService.generatePDFHTML(report, stats, tasks);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const tempPath = path.join(process.cwd(), 'temp', `report-${report.id}-${Date.now()}.pdf`);
      
      // Créer le dossier temp s'il n'existe pas
      const tempDir = path.dirname(tempPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      await page.pdf({
        path: tempPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });
      
      await browser.close();
      
      // Upload to MinIO via FilesService
      const mockFile = {
        originalname: `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        path: tempPath,
        size: fs.statSync(tempPath).size,
        mimetype: 'application/pdf'
      } as Express.Multer.File;
      
      const uploadedFile = await this.filesService.upload(mockFile, report.createdById);
      
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      
      return uploadedFile.path;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
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
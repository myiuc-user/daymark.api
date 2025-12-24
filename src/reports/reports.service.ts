import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as cron from 'node-cron';
import * as puppeteer from 'puppeteer';
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
      const reportStats = await this.generateReportStats(report, reportData);
      const pdfPath = await this.generatePDF(report, reportStats);
      
      // Envoyer l'email avec le rapport et les statistiques
      if (report.recipients && report.recipients.length > 0) {
        await this.emailService.sendReportEmail(
          report.recipients,
          report.name,
          report.description || '',
          report.reportType,
          reportStats,
          pdfPath
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

  private async generateReportStats(report: any, reportData: any) {
    const filters = report.filters || {};
    const dateRange = parseInt(filters.dateRange || '7');
    const dateFilter = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);
    
    // Statistiques générales
    const totalTasks = Array.isArray(reportData) ? reportData.length : 0;
    const completedTasks = Array.isArray(reportData) ? 
      reportData.filter(task => task.status === 'DONE').length : 0;
    const inProgressTasks = Array.isArray(reportData) ? 
      reportData.filter(task => task.status === 'IN_PROGRESS').length : 0;
    const todoTasks = Array.isArray(reportData) ? 
      reportData.filter(task => task.status === 'TODO').length : 0;
    
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

  private async generatePDF(report: any, stats: any): Promise<string> {
    try {
      // Utiliser Puppeteer en mode local au lieu du service distant
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
      
      const htmlContent = this.generatePDFHTML(report, stats);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfPath = `reports/report-${report.id}-${Date.now()}.pdf`;
      const fullPath = path.join(process.cwd(), pdfPath);
      
      // Créer le dossier s'il n'existe pas
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await page.pdf({
        path: fullPath,
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
      return pdfPath;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }
  
  private generatePDFHTML(report: any, stats: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${report.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 12px; color: #6b7280; }
        .progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; margin: 10px 0; }
        .progress-fill { background: #10b981; height: 8px; border-radius: 4px; }
        .section { margin: 30px 0; }
        .user-item, .project-item { background: #f9fafb; padding: 12px; margin: 8px 0; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.name}</h1>
        <p>${report.description || 'Rapport généré automatiquement'}</p>
        <p><strong>Type:</strong> ${report.reportType} | <strong>Période:</strong> ${stats.period}</p>
        <p><strong>Généré le:</strong> ${stats.generatedAt}</p>
    </div>
    
    <div class="section">
        <h2>📊 Statistiques générales</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.totalTasks}</div>
                <div class="stat-label">Total tâches</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.completedTasks}</div>
                <div class="stat-label">Terminées</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.inProgressTasks}</div>
                <div class="stat-label">En cours</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.todoTasks}</div>
                <div class="stat-label">À faire</div>
            </div>
        </div>
        
        <div style="margin: 20px 0;">
            <h3>Taux de completion: ${stats.completionRate}%</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${stats.completionRate}%;"></div>
            </div>
        </div>
    </div>
    
    ${stats.userStats?.length > 0 ? `
        <div class="section">
            <h2>👥 Performance par utilisateur</h2>
            ${stats.userStats.map((user: any) => `
                <div class="user-item">
                    <strong>${user.name}</strong><br>
                    ${user.totalTasks} tâches • ${user.completedTasks} terminées • ${user.inProgressTasks} en cours
                </div>
            `).join('')}
        </div>
    ` : ''}
    
    ${stats.projectStats?.length > 0 ? `
        <div class="section">
            <h2>📁 Performance par projet</h2>
            ${stats.projectStats.map((project: any) => `
                <div class="project-item">
                    <strong>${project.name}</strong><br>
                    ${project.totalTasks} tâches • ${project.completedTasks} terminées • ${project.inProgressTasks} en cours
                </div>
            `).join('')}
        </div>
    ` : ''}
</body>
</html>`;
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
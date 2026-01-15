import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private invitationTemplate: HandlebarsTemplateDelegate;
  private roleUpdateTemplate: HandlebarsTemplateDelegate;
  private taskCompletedTemplate: HandlebarsTemplateDelegate;
  private twoFATemplate: HandlebarsTemplateDelegate;
  private twoFARecoveryTemplate: HandlebarsTemplateDelegate;
  private reportTemplate: HandlebarsTemplateDelegate;
  private reportPdfTemplate: HandlebarsTemplateDelegate;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Load invitation template
    const invitationTemplatePath = path.join(__dirname, 'invitation-email.hbs');
    const invitationTemplateSource = fs.readFileSync(invitationTemplatePath, 'utf8');
    this.invitationTemplate = Handlebars.compile(invitationTemplateSource);
    
    // Load role update template
    const roleUpdateTemplatePath = path.join(__dirname, 'role-update-email.hbs');
    const roleUpdateTemplateSource = fs.readFileSync(roleUpdateTemplatePath, 'utf8');
    this.roleUpdateTemplate = Handlebars.compile(roleUpdateTemplateSource);
    
    // Load task completed template
    const taskCompletedTemplatePath = path.join(__dirname, 'task-completed-email.hbs');
    const taskCompletedTemplateSource = fs.readFileSync(taskCompletedTemplatePath, 'utf8');
    this.taskCompletedTemplate = Handlebars.compile(taskCompletedTemplateSource);
    
    // Load 2FA template
    const twoFATemplatePath = path.join(__dirname, '2fa-code-email.hbs');
    const twoFATemplateSource = fs.readFileSync(twoFATemplatePath, 'utf8');
    this.twoFATemplate = Handlebars.compile(twoFATemplateSource);
    
    // Load 2FA recovery template
    const twoFARecoveryTemplatePath = path.join(__dirname, '2fa-recovery-email.hbs');
    const twoFARecoveryTemplateSource = fs.readFileSync(twoFARecoveryTemplatePath, 'utf8');
    this.twoFARecoveryTemplate = Handlebars.compile(twoFARecoveryTemplateSource);
    
    // Load report template
    const reportTemplatePath = path.join(__dirname, 'report-email.hbs');
    const reportTemplateSource = fs.readFileSync(reportTemplatePath, 'utf8');
    this.reportTemplate = Handlebars.compile(reportTemplateSource);
    
    // Load report PDF template
    const reportPdfTemplatePath = path.join(__dirname, 'report-pdf.hbs');
    const reportPdfTemplateSource = fs.readFileSync(reportPdfTemplatePath, 'utf8');
    this.reportPdfTemplate = Handlebars.compile(reportPdfTemplateSource);
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const emailUser = process.env.EMAIL_USER || 'galio.noreply@myiuc.com';
      const emailPass = process.env.EMAIL_PASS || 'U5/_2304@@g@l!0-2023=' ;
      
      console.log('Email configuration:', {
        user: emailUser,
        hasPassword: !!emailPass,
        passwordLength: emailPass ? emailPass.length : 0
      });
      
      if (!emailPass) {
        throw new Error('EMAIL_PASS environment variable is not set');
      }
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5
      });
    }
    return this.transporter;
  }

  async sendInvitationEmail(email: string, token: string, workspaceName: string, inviterName: string) {
    try {
      console.log('Sending invitation email to:', email);
      console.log('Environment variables:', {
        FRONTEND_URL: process.env.FRONTEND_URL,
        EMAIL_PASS: process.env.EMAIL_PASS ? '***' : 'NOT_SET'
      });
      
      const acceptUrl = `${process.env.FRONTEND_URL}/invite/${token}`;
      
      const htmlContent = this.invitationTemplate({
        workspaceName,
        inviterName,
        acceptUrl
      });

      const mailOptions = {
        from: 'galio.noreply@myiuc.com',
        to: email,
        subject: `You're invited to join ${workspaceName}`,
        html: htmlContent
      };

      const transporter = this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, message: 'Invitation email sent' };
    } catch (error: any) {
      console.error('Error sending invitation email:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code
      });
      return { success: false, message: error?.message || 'Failed to send email' };
    }
  }

  async sendRoleUpdateEmail(email: string, userName: string, workspaceName: string, oldRole: string, newRole: string, updatedBy: string) {
    try {
      console.log('Sending role update email to:', email);
      
      const htmlContent = this.roleUpdateTemplate({
        userName,
        workspaceName,
        oldRole,
        newRole,
        updatedBy
      });

      const mailOptions = {
        from: 'galio.noreply@myiuc.com',
        to: email,
        subject: `Your role has been updated in ${workspaceName}`,
        html: htmlContent
      };

      const transporter = this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('Role update email sent successfully:', result.messageId);
      return { success: true, message: 'Role update email sent' };
    } catch (error: any) {
      console.error('Error sending role update email:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code
      });
      return { success: false, message: error?.message || 'Failed to send email' };
    }
  }

  async sendTaskCompletedEmail(email: string, projectLeadName: string, taskTitle: string, projectName: string, completedBy: string) {
    try {
      console.log('Sending task completed email to:', email);
      
      const htmlContent = this.taskCompletedTemplate({
        projectLeadName,
        taskTitle,
        projectName,
        completedBy
      });

      const mailOptions = {
        from: 'galio.noreply@myiuc.com',
        to: email,
        subject: `Task completed: ${taskTitle}`,
        html: htmlContent
      };

      const transporter = this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('Task completed email sent successfully:', result.messageId);
      return { success: true, message: 'Task completed email sent' };
    } catch (error: any) {
      console.error('Error sending task completed email:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code
      });
      return { success: false, message: error?.message || 'Failed to send email' };
    }
  }

  async send2FACode(email: string, code: string) {
    try {
      console.log('Sending 2FA code email to:', email);
      
      const htmlContent = this.twoFATemplate({ code });

      const mailOptions = {
        from: 'galio.noreply@myiuc.com',
        to: email,
        subject: 'Code de vérification Daymark',
        html: htmlContent
      };

      const transporter = this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('2FA code email sent successfully:', result.messageId);
      return { success: true, message: '2FA code email sent' };
    } catch (error: any) {
      console.error('Error sending 2FA code email:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code
      });
      return { success: false, message: error?.message || 'Failed to send email' };
    }
  }

  async send2FARecoveryEmail(email: string, recoveryToken: string) {
    try {
      console.log('Sending 2FA recovery email to:', email);
      
      const recoveryUrl = `${process.env.FRONTEND_URL}/auth/2fa/recover/${recoveryToken}`;
      const htmlContent = this.twoFARecoveryTemplate({ recoveryUrl });

      const mailOptions = {
        from: 'galio.noreply@myiuc.com',
        to: email,
        subject: 'Récupération 2FA - Daymark',
        html: htmlContent
      };

      const transporter = this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('2FA recovery email sent successfully:', result.messageId);
      return { success: true, message: '2FA recovery email sent' };
    } catch (error: any) {
      console.error('Error sending 2FA recovery email:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code
      });
      return { success: false, message: error?.message || 'Failed to send email' };
    }
  }

  async sendReportEmail(recipients: string[], reportName: string, description: string, reportType: string, stats?: any, pdfBuffer?: Buffer, tasks?: any[]) {
    try {
      console.log('Sending report email:', {
        recipients,
        reportName,
        hasPdfBuffer: !!pdfBuffer,
        pdfBufferSize: pdfBuffer ? pdfBuffer.length : 0
      });
      
      // Register Handlebars helpers for template
      Handlebars.registerHelper('eq', function(a, b) {
        return a === b;
      });
      
      const htmlContent = this.reportTemplate({
        reportName,
        description: description || 'Rapport généré automatiquement',
        reportType,
        generatedAt: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Lagos' }),
        stats,
        tasks: tasks || []
      });

      const mailOptions = {
        from: 'galio.noreply@myiuc.com',
        to: recipients,
        subject: `Rapport automatisé: ${reportName}`,
        html: htmlContent,
        ...(pdfBuffer && {
          attachments: [{
            filename: `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        })
      };

      const transporter = this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      console.log('Report email sent successfully:', result.messageId);
      return { success: true, message: 'Report email sent' };
    } catch (error: any) {
      console.error('Error sending report email:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code
      });
      return { success: false, message: error?.message || 'Failed to send email' };
    }
  }

  generatePDFHTML(report: any, stats: any, tasks: any = []): string {
    // Register Handlebars helpers
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    return this.reportPdfTemplate({
      reportName: report.name,
      description: report.description || 'Rapport généré automatiquement',
      reportType: report.reportType,
      stats,
      tasks
    });
  }
}
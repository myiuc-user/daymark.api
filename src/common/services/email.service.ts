import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private invitationTemplate: HandlebarsTemplateDelegate;
  private roleUpdateTemplate: HandlebarsTemplateDelegate;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const templateSource = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Workspace Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">You're invited to join {{workspaceName}}</h2>
        
        <p>Hi there,</p>
        
        <p>{{inviterName}} has invited you to join the workspace "<strong>{{workspaceName}}</strong>" on Daymark.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{acceptUrl}}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            This invitation expires in 7 days. If you don't want to join this workspace, you can ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            {{acceptUrl}}
        </p>
    </div>
</body>
</html>`;
    this.invitationTemplate = Handlebars.compile(templateSource);
    
    const roleUpdateTemplateSource = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Role Updated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Your role has been updated</h2>
        
        <p>Hi {{userName}},</p>
        
        <p>Your role in workspace "<strong>{{workspaceName}}</strong>" has been updated by {{updatedBy}}.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Previous role:</strong> {{oldRole}}</p>
            <p style="margin: 0;"><strong>New role:</strong> {{newRole}}</p>
        </div>
        
        <p>This change is effective immediately.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
            This is an automated notification from Daymark.
        </p>
    </div>
</body>
</html>`;
    this.roleUpdateTemplate = Handlebars.compile(roleUpdateTemplateSource);
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
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Task Completed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Task Completed</h2>
        
        <p>Hi ${projectLeadName},</p>
        
        <p>${completedBy} has marked the task "<strong>${taskTitle}</strong>" as completed in project "<strong>${projectName}</strong>".</p>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af;"><strong>✓ Task Status:</strong> Completed</p>
        </div>
        
        <p>Great progress on the project!</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
            This is an automated notification from Daymark.
        </p>
    </div>
</body>
</html>`;

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
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Code de vérification Daymark</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Code de vérification</h2>
        
        <p>Votre code de vérification à deux facteurs est :</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; border-radius: 6px;">
            ${code}
        </div>
        
        <p style="color: #666;">Ce code expire dans 5 minutes.</p>
        <p style="color: #666;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
            Ceci est une notification automatique de Daymark.
        </p>
    </div>
</body>
</html>`;

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

  async sendReportEmail(recipients: string[], reportName: string, description: string, reportType: string, stats?: any) {
    try {
      const statsHtml = stats ? `
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">📊 Statistiques (${stats.period})</h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 15px 0;">
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${stats.totalTasks}</div>
              <div style="font-size: 12px; color: #6b7280;">Total tâches</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.completedTasks}</div>
              <div style="font-size: 12px; color: #6b7280;">Terminées</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${stats.inProgressTasks}</div>
              <div style="font-size: 12px; color: #6b7280;">En cours</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 6px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${stats.todoTasks}</div>
              <div style="font-size: 12px; color: #6b7280;">À faire</div>
            </div>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #e5e7eb;">
            <div style="font-size: 18px; font-weight: bold; color: #1f2937;">Taux de completion: ${stats.completionRate}%</div>
            <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin: 8px 0;">
              <div style="background: #10b981; height: 8px; border-radius: 4px; width: ${stats.completionRate}%;"></div>
            </div>
          </div>
          
          ${stats.userStats?.length > 0 ? `
            <div style="margin: 20px 0;">
              <h4 style="color: #1f2937;">👥 Performance par utilisateur</h4>
              ${stats.userStats.map((user: any) => `
                <div style="background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="font-weight: bold;">${user.name}</div>
                  <div style="font-size: 14px; color: #6b7280;">
                    ${user.totalTasks} tâches • ${user.completedTasks} terminées • ${user.inProgressTasks} en cours
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${stats.projectStats?.length > 0 ? `
            <div style="margin: 20px 0;">
              <h4 style="color: #1f2937;">📁 Performance par projet</h4>
              ${stats.projectStats.map((project: any) => `
                <div style="background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="font-weight: bold;">${project.name}</div>
                  <div style="font-size: 14px; color: #6b7280;">
                    ${project.totalTasks} tâches • ${project.completedTasks} terminées • ${project.inProgressTasks} en cours
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
            Généré le: ${stats.generatedAt}
          </div>
        </div>
      ` : '';
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport automatisé</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">${reportName}</h2>
        <p>${description || 'Rapport généré automatiquement'}</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p><strong>Type:</strong> ${reportType}</p>
            <p><strong>Généré le:</strong> ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Lagos' })}</p>
        </div>
        ${statsHtml}
    </div>
</body>
</html>`;

      const mailOptions = {
        from: 'galio.noreply@myiuc.com',
        to: recipients,
        subject: `Rapport automatisé: ${reportName}`,
        html: htmlContent
      };

      const transporter = this.getTransporter();
      const result = await transporter.sendMail(mailOptions);
      return { success: true, message: 'Report email sent' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Failed to send email' };
    }
  }
}
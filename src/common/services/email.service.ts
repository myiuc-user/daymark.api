import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private invitationTemplate: HandlebarsTemplateDelegate;
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
      
      const acceptUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;
      
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
}
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
      this.transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: 'galio.noreply@myiuc.com',
          pass: process.env.MAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: true
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

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Invitation email sent' };
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return { success: false, message: 'Failed to send invitation email' };
    }
  }
}
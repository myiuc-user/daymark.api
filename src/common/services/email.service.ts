import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private invitationTemplate: HandlebarsTemplateDelegate;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const templatePath = path.join(__dirname, '../templates/invitation.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
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
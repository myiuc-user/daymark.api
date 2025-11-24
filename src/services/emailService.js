import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendInvitationEmail = async (email, workspaceName, inviteLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🚀 Join ${workspaceName} - Your collaboration awaits`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to ${workspaceName}</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <span style="font-size: 24px; color: white;">📋</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">You're Invited!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Join the ${workspaceName} workspace</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Welcome to ${workspaceName}</h2>
              <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.6;">You've been invited to collaborate on an exciting project. Join your team and start making an impact together.</p>
            </div>
            
            <!-- Features -->
            <div style="margin: 30px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                  <span style="font-size: 18px;">🎯</span>
                </div>
                <div>
                  <h4 style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">Project Management</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 13px;">Organize tasks and track progress</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                  <span style="font-size: 18px;">👥</span>
                </div>
                <div>
                  <h4 style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">Team Collaboration</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 13px;">Work together seamlessly</p>
                </div>
              </div>
              <div style="display: flex; align-items: center;">
                <div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                  <span style="font-size: 18px;">📊</span>
                </div>
                <div>
                  <h4 style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">Analytics & Insights</h4>
                  <p style="margin: 0; color: #6b7280; font-size: 13px;">Track performance and metrics</p>
                </div>
              </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0 30px;">
              <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3); transition: all 0.3s ease;">
                🚀 Accept Invitation
              </a>
            </div>
            
            <!-- Alternative Link -->
            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-top: 30px;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; font-weight: 500;">Can't click the button?</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; word-break: break-all; font-family: monospace;">${inviteLink}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">This invitation was sent to <strong>${email}</strong></p>
            <p style="margin: 8px 0 0; color: #d1d5db; font-size: 12px;">© 2024 Daymark Project Management. All rights reserved.</p>
          </div>
          
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};
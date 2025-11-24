import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    this.clients = new Map(); // userId -> Set of response objects
  }

  // Add SSE client
  addClient(userId, res) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);

    // Remove client on disconnect
    res.on('close', () => {
      this.removeClient(userId, res);
    });
  }

  // Remove SSE client
  removeClient(userId, res) {
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(res);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  // Create notification in database
  async createNotification(notificationData) {
    return await prisma.notification.create({
      data: notificationData
    });
  }

  // Send notification to specific user
  async sendToUser(userId, notification) {
    // Save to database
    const dbNotification = await this.createNotification({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {}
    });

    // Send via SSE if user is connected
    if (this.clients.has(userId)) {
      const clients = this.clients.get(userId);
      const data = JSON.stringify({ ...notification, id: dbNotification.id });
      
      clients.forEach(res => {
        try {
          res.write(`data: ${data}\n\n`);
        } catch (error) {
          console.error('SSE send error:', error);
          this.removeClient(userId, res);
        }
      });
    }

    return dbNotification;
  }

  // Send notification to project members
  async sendToProject(projectId, notification, excludeUserId = null) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: { user: true }
        },
        owner: true
      }
    });

    if (!project) return;

    const userIds = [
      project.team_lead,
      ...project.members.map(m => m.userId)
    ].filter(id => id !== excludeUserId);

    for (const userId of userIds) {
      await this.sendToUser(userId, notification);
    }
  }

  // Send notification to workspace members
  async sendToWorkspace(workspaceId, notification, excludeUserId = null) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    if (!workspace) return;

    const userIds = [
      workspace.ownerId,
      ...workspace.members.map(m => m.userId)
    ].filter(id => id !== excludeUserId);

    for (const userId of userIds) {
      await this.sendToUser(userId, notification);
    }
  }

  // Send email notification (if configured)
  async sendEmail(userId, subject, content) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });
      
      if (user) {
        // Email service would be implemented here
        console.log(`Email notification sent to ${user.email}: ${subject}`);
      }
    } catch (error) {
      console.error('Email notification error:', error);
    }
  }

  // Schedule notification (for due dates, etc.)
  async scheduleNotification(userId, notification, scheduleDate) {
    // This would integrate with a job scheduler like node-cron
    console.log(`Notification scheduled for ${scheduleDate}:`, notification);
  }
}

export const notificationService = new NotificationService();
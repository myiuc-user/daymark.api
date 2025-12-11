import prisma from '../config/prisma.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Socket.io initialization
class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.roomUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, name: true, email: true, image: true, isActive: true }
        });

        if (!user || !user.isActive) {
          return next(new Error('User not found or inactive'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected with socket ${socket.id}`);
      
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        user: socket.user,
        lastSeen: new Date()
      });

      socket.join(`user:${socket.userId}`);
      console.log(`User ${socket.userId} joined room user:${socket.userId}`);

      socket.on('join-project', async (projectId) => {
        try {
          const project = await prisma.project.findFirst({
            where: {
              id: projectId,
              OR: [
                { team_lead: socket.userId },
                { members: { some: { userId: socket.userId } } },
                { workspace: { 
                  OR: [
                    { ownerId: socket.userId },
                    { members: { some: { userId: socket.userId } } }
                  ]
                }}
              ]
            }
          });

          if (project) {
            socket.join(`project:${projectId}`);
            
            if (!this.roomUsers.has(projectId)) {
              this.roomUsers.set(projectId, new Set());
            }
            this.roomUsers.get(projectId).add(socket.userId);

            socket.to(`project:${projectId}`).emit('user-joined', {
              user: socket.user,
              projectId
            });

            const roomUserIds = Array.from(this.roomUsers.get(projectId));
            const roomUsers = roomUserIds.map(id => this.connectedUsers.get(id)?.user).filter(Boolean);
            
            socket.emit('room-users', { projectId, users: roomUsers });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to join project room' });
        }
      });

      socket.on('leave-project', (projectId) => {
        socket.leave(`project:${projectId}`);
        
        if (this.roomUsers.has(projectId)) {
          this.roomUsers.get(projectId).delete(socket.userId);
        }

        socket.to(`project:${projectId}`).emit('user-left', {
          user: socket.user,
          projectId
        });
      });

      socket.on('task-update', (data) => {
        socket.to(`project:${data.projectId}`).emit('task-updated', {
          ...data,
          updatedBy: socket.user
        });
      });

      socket.on('typing-start', (data) => {
        socket.to(`project:${data.projectId}`).emit('user-typing', {
          user: socket.user,
          taskId: data.taskId,
          projectId: data.projectId
        });
      });

      socket.on('typing-stop', (data) => {
        socket.to(`project:${data.projectId}`).emit('user-stopped-typing', {
          user: socket.user,
          taskId: data.taskId,
          projectId: data.projectId
        });
      });

      socket.on('cursor-move', (data) => {
        socket.to(`project:${data.projectId}`).emit('cursor-moved', {
          user: socket.user,
          position: data.position,
          taskId: data.taskId,
          projectId: data.projectId
        });
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected`);
        
        this.connectedUsers.delete(socket.userId);
        
        for (const [projectId, users] of this.roomUsers.entries()) {
          if (users.has(socket.userId)) {
            users.delete(socket.userId);
            socket.to(`project:${projectId}`).emit('user-left', {
              user: socket.user,
              projectId
            });
          }
        }
      });
    });
  }

  sendNotification(userId, notification) {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }
    console.log(`Sending notification to user ${userId}:`, notification);
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  sendProjectUpdate(projectId, event, data) {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  getProjectUsers(projectId) {
    const userIds = this.roomUsers.get(projectId) || new Set();
    return Array.from(userIds).map(id => this.connectedUsers.get(id)?.user).filter(Boolean);
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }
}

const socketService = new SocketService();

// Email service
const uploadDir = path.join(__dirname, '../../uploads/profiles');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.office365.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const loadTemplate = (templateName) => {
  try {
    const templatePath = path.join(__dirname, '../views/emails', `${templateName}.hbs`);
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    return Handlebars.compile(templateContent);
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);
    throw error;
  }
};

const compiledTemplates = {
  invitation: loadTemplate('invitation'),
  taskAssignment: loadTemplate('taskAssignment'),
  projectUpdate: loadTemplate('projectUpdate')
};

const sendInvitationEmail = async (email, workspaceName, inviteLink, userName = 'there') => {
  const html = compiledTemplates.invitation({ workspaceName, inviteLink, userName });
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🚀 Join ${workspaceName} - Your collaboration awaits`,
    html
  });
};

const sendTaskAssignmentEmail = async (email, taskData) => {
  const html = compiledTemplates.taskAssignment({
    taskTitle: taskData.title,
    taskDescription: taskData.description,
    projectName: taskData.projectName,
    taskPriority: taskData.priority,
    dueDate: taskData.dueDate,
    taskLink: taskData.taskLink
  });
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `📋 New Task: ${taskData.title}`,
    html
  });
};

const sendProjectUpdateEmail = async (email, updateData) => {
  const html = compiledTemplates.projectUpdate({
    projectName: updateData.projectName,
    updateTitle: updateData.title,
    updateMessage: updateData.message,
    projectLink: updateData.projectLink
  });
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `📊 ${updateData.title}`,
    html
  });
};

// Notification service
export const notificationService = {
  socketService,

  getPreferences: async (userId) => {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    return prefs;
  },

  updatePreferences: async (userId, data) => {
    return await prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data }
    });
  },

  createNotification: async (userId, data) => {
    try {
      let prefs = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      if (!prefs) {
        prefs = await prisma.notificationPreference.create({
          data: { userId, inAppNotifications: true, emailNotifications: true }
        });
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedId: data.relatedId,
          relatedType: data.relatedType
        }
      });

      if (prefs.inAppNotifications && socketService.io) {
        socketService.sendNotification(userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt,
          read: false
        });
      }

      if (prefs.emailNotifications && data.emailData) {
        notificationService.sendEmailAsync(userId, data.emailData).catch(err => 
          console.error('Email send error:', err)
        );
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  },

  sendEmailAsync: async (userId, emailData) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      if (emailData.type === 'task_assignment') {
        await sendTaskAssignmentEmail(user.email, emailData);
      } else if (emailData.type === 'project_update') {
        await sendProjectUpdateEmail(user.email, emailData);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  },

  notifyTaskAssignment: async (taskId, assigneeId, assignedBy) => {
    if (assigneeId === assignedBy) return null;
    
    try {
      const task = await prisma.task.findUnique({ 
        where: { id: taskId },
        include: { project: true }
      });
      const assigner = await prisma.user.findUnique({ where: { id: assignedBy } });

      return notificationService.createNotification(assigneeId, {
        type: 'assignment',
        title: 'Task Assigned',
        message: `${assigner.name} assigned you "${task.title}"`,
        relatedId: taskId,
        relatedType: 'task',
        emailData: {
          type: 'task_assignment',
          title: task.title,
          description: task.description,
          projectName: task.project.name,
          priority: task.priority,
          dueDate: task.due_date,
          taskLink: `${process.env.FRONTEND_URL}/tasks/${taskId}`
        }
      });
    } catch (error) {
      console.error('Error notifying task assignment:', error);
      return null;
    }
  },

  notifyTaskComment: async (taskId, commenterId, taskOwnerId) => {
    if (commenterId === taskOwnerId) return null;

    try {
      const task = await prisma.task.findUnique({ 
        where: { id: taskId },
        include: { watchers: true, project: true }
      });
      const commenter = await prisma.user.findUnique({ where: { id: commenterId } });

      const notifyUsers = new Set([
        taskOwnerId,
        ...task.watchers.map(w => w.userId)
      ].filter(id => id !== commenterId));

      for (const userId of notifyUsers) {
        await notificationService.createNotification(userId, {
          type: 'comment',
          title: 'New Comment',
          message: `${commenter.name} commented on "${task.title}"`,
          relatedId: taskId,
          relatedType: 'task',
          emailData: {
            type: 'task_assignment',
            title: `New comment on ${task.title}`,
            description: `${commenter.name} commented on your task`,
            projectName: task.project.name,
            priority: task.priority,
            dueDate: task.due_date,
            taskLink: `${process.env.FRONTEND_URL}/tasks/${taskId}`
          }
        });
      }
    } catch (error) {
      console.error('Error notifying task comment:', error);
    }
  },

  notifyMention: async (userId, mentionedBy, taskId, taskTitle) => {
    try {
      const mentioner = await prisma.user.findUnique({ where: { id: mentionedBy } });

      return notificationService.createNotification(userId, {
        type: 'mention',
        title: 'You were mentioned',
        message: `${mentioner.name} mentioned you in "${taskTitle}"`,
        relatedId: taskId,
        relatedType: 'task'
      });
    } catch (error) {
      console.error('Error notifying mention:', error);
    }
  },

  notifyTaskUpdate: async (taskId, updatedBy, changes) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { watchers: true, assignee: true, project: true }
      });

      const updater = await prisma.user.findUnique({ where: { id: updatedBy } });
      const changeText = Object.keys(changes).join(', ');

      const notifyUsers = new Set([
        task.createdById,
        task.assigneeId,
        ...task.watchers.map(w => w.userId)
      ].filter(Boolean));

      for (const userId of notifyUsers) {
        if (userId !== updatedBy) {
          await notificationService.createNotification(userId, {
            type: 'task_update',
            title: 'Task Updated',
            message: `${updater.name} updated "${task.title}" (${changeText})`,
            relatedId: taskId,
            relatedType: 'task'
          });
        }
      }
    } catch (error) {
      console.error('Error notifying task update:', error);
    }
  },

  notifyTaskCompleted: async (taskId, completedBy) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { watchers: true, assignee: true, project: true }
      });

      const completer = await prisma.user.findUnique({ where: { id: completedBy } });

      const notifyUsers = new Set([
        task.createdById,
        task.assigneeId,
        ...task.watchers.map(w => w.userId)
      ].filter(Boolean));

      for (const userId of notifyUsers) {
        if (userId !== completedBy) {
          await notificationService.createNotification(userId, {
            type: 'task_completed',
            title: 'Task Completed',
            message: `${completer.name} completed "${task.title}"`,
            relatedId: taskId,
            relatedType: 'task'
          });
        }
      }
    } catch (error) {
      console.error('Error notifying task completion:', error);
    }
  },

  notifyProjectMembers: async (task, creatorId) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { members: { select: { userId: true } } }
      });

      if (!project) return;

      const creator = await prisma.user.findUnique({ where: { id: creatorId } });
      const projectLead = project.team_lead;

      const notifyUsers = new Set();
      
      if (projectLead && projectLead !== creatorId) {
        notifyUsers.add(projectLead);
      }

      project.members.forEach(member => {
        if (member.userId !== creatorId) {
          notifyUsers.add(member.userId);
        }
      });

      for (const userId of notifyUsers) {
        await notificationService.createNotification(userId, {
          type: 'task_created',
          title: 'New Task Created',
          message: `${creator.name} created task "${task.title}"`,
          relatedId: task.id,
          relatedType: 'task'
        });
      }
    } catch (error) {
      console.error('Error notifying project members:', error);
    }
  },

  getNotifications: async (userId, limit = 50, offset = 0) => {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.notification.count({ where: { userId } });
    return { notifications, total };
  },

  loadNotificationsForUser: async (userId) => {
    const { notifications } = await notificationService.getNotifications(userId, 50, 0);
    
    if (socketService.io) {
      socketService.io.to(`user:${userId}`).emit('notifications-batch', notifications);
    }

    return notifications;
  },

  markAsRead: async (notificationId, userId) => {
    const notification = await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true }
    });

    if (socketService.io) {
      socketService.io.to(`user:${userId}`).emit('notification-read', { id: notificationId });
    }
    return notification;
  },

  markAllAsRead: async (userId) => {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    if (socketService.io) {
      socketService.io.to(`user:${userId}`).emit('notifications-cleared');
    }
  },

  deleteNotification: async (notificationId, userId) => {
    await prisma.notification.delete({
      where: { id: notificationId, userId }
    });

    if (socketService.io) {
      socketService.io.to(`user:${userId}`).emit('notification-deleted', { id: notificationId });
    }
  },

  sendToUser: async (userId, data) => {
    return notificationService.createNotification(userId, data);
  },

  sendToProject: async (projectId, data) => {
    try {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true }
      });

      for (const member of projectMembers) {
        await notificationService.createNotification(member.userId, data);
      }
    } catch (error) {
      console.error('Error sending notification to project:', error);
    }
  },

  sendInvitationEmail,
  sendTaskAssignmentEmail,
  sendProjectUpdateEmail
};

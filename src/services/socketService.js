import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

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
      
      // Store user connection
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        user: socket.user,
        lastSeen: new Date()
      });

      // Join user to their personal room
      socket.join(`user:${socket.userId}`);
      console.log(`User ${socket.userId} joined room user:${socket.userId}`);

      // Handle joining project rooms
      socket.on('join-project', async (projectId) => {
        try {
          // Verify user has access to project
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
            
            // Track users in room
            if (!this.roomUsers.has(projectId)) {
              this.roomUsers.set(projectId, new Set());
            }
            this.roomUsers.get(projectId).add(socket.userId);

            // Notify others in the room
            socket.to(`project:${projectId}`).emit('user-joined', {
              user: socket.user,
              projectId
            });

            // Send current room users
            const roomUserIds = Array.from(this.roomUsers.get(projectId));
            const roomUsers = roomUserIds.map(id => this.connectedUsers.get(id)?.user).filter(Boolean);
            
            socket.emit('room-users', { projectId, users: roomUsers });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to join project room' });
        }
      });

      // Handle leaving project rooms
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

      // Handle task updates
      socket.on('task-update', (data) => {
        socket.to(`project:${data.projectId}`).emit('task-updated', {
          ...data,
          updatedBy: socket.user
        });
      });

      // Handle typing indicators
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

      // Handle cursor position sharing
      socket.on('cursor-move', (data) => {
        socket.to(`project:${data.projectId}`).emit('cursor-moved', {
          user: socket.user,
          position: data.position,
          taskId: data.taskId,
          projectId: data.projectId
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected`);
        
        // Remove from connected users
        this.connectedUsers.delete(socket.userId);
        
        // Remove from all rooms
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

  // Send notification to specific user
  sendNotification(userId, notification) {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }
    console.log(`Sending notification to user ${userId}:`, notification);
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Send update to project room
  sendProjectUpdate(projectId, event, data) {
    if (!this.io) {
      console.warn('Socket.io not initialized');
      return;
    }
    this.io.to(`project:${projectId}`).emit(event, data);
  }

  // Get online users in project
  getProjectUsers(projectId) {
    const userIds = this.roomUsers.get(projectId) || new Set();
    return Array.from(userIds).map(id => this.connectedUsers.get(id)?.user).filter(Boolean);
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get all connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }
}

export const socketService = new SocketService();

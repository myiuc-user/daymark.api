import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './src/config/database.js';
import prisma, { reconnectPrisma } from './src/config/prisma.js';
import { createRootAdmin, resetAdminPassword } from './src/services/authService.js';
import { createDatabaseIfNotExists } from './src/config/database.js';
import { cronService } from './src/services/cronService.js';
import { notificationService } from './src/services/notificationService.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import workspaceRoutes from './src/routes/workspaceRoutes.js';
import invitationRoutes from './src/routes/invitationRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import fileRoutes from './src/routes/fileRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import githubRoutes from './src/routes/githubRoutes.js';
import milestoneRoutes from './src/routes/milestoneRoutes.js';
import sprintRoutes from './src/routes/sprintRoutes.js';
import timeTrackingRoutes from './src/routes/timeTrackingRoutes.js';
import templateRoutes from './src/routes/templateRoutes.js';
import workflowRoutes from './src/routes/workflowRoutes.js';
import collaborationRoutes from './src/routes/collaborationRoutes.js';
import teamRoutes from './src/routes/teamRoutes.js';
import searchRoutes from './src/routes/searchRoutes.js';
import delegationRoutes from './src/routes/delegationRoutes.js';
import auditRoutes from './src/routes/auditRoutes.js';
import { auditMiddleware } from './src/middleware/auditMiddleware.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigins = ['http://localhost:5173', process.env.CORS_ORIGIN]
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Disable caching for API responses
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    return next();
  }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const userId = req.user?.id || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    console.log(`[${new Date().toLocaleTimeString()}] ${statusColor} ${req.method.padEnd(6)} ${req.path} | ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Auth routes (no audit middleware)
app.use('/auth', authRoutes);

// Audit middleware (for authenticated routes only)
app.use(auditMiddleware);

// Register all other routes
app.use('/users', userRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/invitations', invitationRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/comments', commentRoutes);
app.use('/admin', adminRoutes);
app.use('/files', fileRoutes);
app.use('/notifications', notificationRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/github', githubRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/sprints', sprintRoutes);
app.use('/time-entries', timeTrackingRoutes);
app.use('/templates', templateRoutes);
app.use('/workflows', workflowRoutes);
app.use('/collaboration', collaborationRoutes);
app.use('/teams', teamRoutes);
app.use('/search', searchRoutes);
app.use('/delegations', delegationRoutes);
app.use('/audit', auditRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND', statusCode: 404 });
});

// Error handler (must be last)
app.use(errorHandler);

async function startServer() {
  try {
    await createDatabaseIfNotExists();
    await prisma.$connect();
    console.log('✅ Database connected');
    
    await createRootAdmin();
    await resetAdminPassword();
    console.log('✅ Root admin initialized');
    
    cronService.start();
    console.log('✅ Cron service started');
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 Admin email: ${process.env.ROOT_ADMIN_EMAIL}`);
    });
    
    notificationService.socketService.initialize(server);
    console.log('✅ Socket.io initialized');
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

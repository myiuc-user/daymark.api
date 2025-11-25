import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import './src/config/database.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { createRootAdmin } from './src/services/authService.js';
import { createDatabaseIfNotExists } from './src/config/database.js';
import { socketService } from './src/services/socketService.js';

export const prisma = new PrismaClient();
import { cronService } from './src/services/cronService.js';

// Routes
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import workspaceRoutes, { invitationRouter } from './src/routes/workspaceRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import fileRoutes from './src/routes/fileRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import githubRoutes from './src/routes/githubRoutes.js';
import githubAuthRoutes from './src/routes/githubAuthRoutes.js';
import testRoutes from './src/routes/testRoutes.js';
import milestoneRoutes from './src/routes/milestoneRoutes.js';
import sprintRoutes from './src/routes/sprintRoutes.js';
import timeTrackingRoutes from './src/routes/timeTrackingRoutes.js';
import templateRoutes from './src/routes/templateRoutes.js';
import workflowRoutes from './src/routes/workflowRoutes.js';
import collaborationRoutes from './src/routes/collaborationRoutes.js';
import teamRoutes from './src/routes/teamRoutes.js';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket
socketService.initialize(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/invitations', invitationRouter);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);
app.use('/files', fileRoutes);
app.use('/notifications', notificationRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/github', githubRoutes);
app.use('/github-auth', githubAuthRoutes);
app.use('/test', testRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/sprints', sprintRoutes);
app.use('/time-entries', timeTrackingRoutes);
app.use('/templates', templateRoutes);
app.use('/workflows', workflowRoutes);
app.use('/collaboration', collaborationRoutes);
app.use('/teams', teamRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server and create root admin
async function startServer() {
  try {
    await createDatabaseIfNotExists();
    await prisma.$connect();
    console.log('✅ Database connected');
    
    await createRootAdmin();
    console.log('✅ Root admin initialized');
    
    // Start cron jobs
    cronService.start();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📖 API docs: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

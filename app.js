import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import './src/config/database.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { createRootAdmin } from './src/services/authService.js';
import { createDatabaseIfNotExists } from './src/config/database.js';
import { cronService } from './src/services/cronService.js';

export const prisma = new PrismaClient();

import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import workspaceRoutes from './src/routes/workspaceRoutes.js';
import invitationRoutes from './src/routes/invitationRoutes.js';
import projectRoutes from './src/routes/projectRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import fileRoutes from './src/routes/fileRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import githubRoutes from './src/routes/githubRoutes.js';
import githubAuthRoutes from './src/routes/githubAuthRoutes.js';
import milestoneRoutes from './src/routes/milestoneRoutes.js';
import sprintRoutes from './src/routes/sprintRoutes.js';
import timeTrackingRoutes from './src/routes/timeTrackingRoutes.js';
import templateRoutes from './src/routes/templateRoutes.js';
import workflowRoutes from './src/routes/workflowRoutes.js';
import collaborationRoutes from './src/routes/collaborationRoutes.js';
import teamRoutes from './src/routes/teamRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/invitations', invitationRoutes);
app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);
app.use('/files', fileRoutes);
app.use('/notifications', notificationRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/github', githubRoutes);
app.use('/github-auth', githubAuthRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/sprints', sprintRoutes);
app.use('/time-entries', timeTrackingRoutes);
app.use('/templates', templateRoutes);
app.use('/workflows', workflowRoutes);
app.use('/collaboration', collaborationRoutes);
app.use('/teams', teamRoutes);

async function startServer() {
  try {
    await createDatabaseIfNotExists();
    await prisma.$connect();
    console.log('✅ Database connected');
    
    await createRootAdmin();
    console.log('✅ Root admin initialized');
    
    cronService.start();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

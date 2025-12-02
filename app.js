import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './src/config/database.js';
import prisma, { reconnectPrisma } from './src/config/prisma.js';
import { createRootAdmin, resetAdminPassword } from './src/services/authService.js';
import { createDatabaseIfNotExists } from './src/config/database.js';
import { cronService } from './src/services/cronService.js';
import { routes } from './src/config/routes.js';
import { auditMiddleware } from './src/middleware/auditMiddleware.js';

import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'https://daymark.myiuc.com',
    'https://daymarkserver.myiuc.com',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// Explicit OPTIONS handler for preflight requests
app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.disable('strict routing');

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

// Audit middleware
app.use(auditMiddleware);

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



// Register all routes
routes.forEach(({ path: routePath, router }) => {
  app.use(routePath, router);
});

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
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 Admin email: ${process.env.ROOT_ADMIN_EMAIL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

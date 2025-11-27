import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './src/config/database.js';
import prisma from './src/config/prisma.js';
import { createRootAdmin } from './src/services/authService.js';
import { createDatabaseIfNotExists } from './src/config/database.js';
import { cronService } from './src/services/cronService.js';
import { routes } from './src/config/routes.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

console.log(`[Server] GitHub Client ID: ${process.env.GITHUB_CLIENT_ID}`);
console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL}`);

app.use(cors({
  origin: [
    'https://daymark.myiuc.com',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Register all routes
routes.forEach(({ path, router }) => {
  app.use(path, router);
});

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

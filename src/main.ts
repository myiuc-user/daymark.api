import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response, NextFunction } from 'express';
import { createDatabaseIfNotExists } from './config/database';
import { PrismaService } from './prisma/prisma.service';
import { AuthService } from './auth/auth.service';
import { CronService } from './services/cron.service';

async function bootstrap() {
  try {
    await createDatabaseIfNotExists();
    
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
      origin: ['http://localhost:5173', process.env.CORS_ORIGIN || 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    });

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.path.startsWith('/uploads')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      }
      next();
    });

    const prisma = app.get(PrismaService);
    await prisma.$connect();
    console.log('✅ Database connected');

    const authService = app.get(AuthService);
    await authService.createRootAdmin();
    await authService.resetAdminPassword();
    console.log('✅ Root admin initialized');

    const cronService = app.get(CronService);
    cronService.start();
    console.log('✅ Cron service started');

    const PORT = process.env.PORT || 3001;
    await app.listen(PORT);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Admin email: ${process.env.ROOT_ADMIN_EMAIL}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

bootstrap();

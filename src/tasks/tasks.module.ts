import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [PrismaModule],
  providers: [TasksService, EmailService],
  controllers: [TasksController],
  exports: [TasksService]
})
export class TasksModule {}

import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [PrismaModule],
  providers: [WorkspacesService, EmailService],
  controllers: [WorkspacesController],
  exports: [WorkspacesService]
})
export class WorkspacesModule {}

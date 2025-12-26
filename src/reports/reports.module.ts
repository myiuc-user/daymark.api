import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [ReportsController],
  providers: [ReportsService, EmailService],
  exports: [ReportsService]
})
export class ReportsModule {}
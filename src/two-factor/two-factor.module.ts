import { Module } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [TwoFactorController],
  providers: [TwoFactorService, EmailService],
  exports: [TwoFactorService]
})
export class TwoFactorModule {}
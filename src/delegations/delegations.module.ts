import { Module } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { DelegationsController } from './delegations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DelegationsService],
  controllers: [DelegationsController],
  exports: [DelegationsService]
})
export class DelegationsModule {}

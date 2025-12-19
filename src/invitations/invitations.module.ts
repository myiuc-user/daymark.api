import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InvitationsService],
  controllers: [InvitationsController],
  exports: [InvitationsService]
})
export class InvitationsModule {}

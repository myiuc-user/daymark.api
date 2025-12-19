import { Module } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { SprintsController } from './sprints.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SprintsService],
  controllers: [SprintsController],
  exports: [SprintsService]
})
export class SprintsModule {}

import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GithubService],
  controllers: [GithubController],
  exports: [GithubService]
})
export class GithubModule {}

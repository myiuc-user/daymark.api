import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollaborationService {
  constructor(private prisma: PrismaService) {}

  async createMention(data: any) {
    return this.prisma.mention.create({ data });
  }

  async addWatcher(taskId: string, userId: string) {
    return this.prisma.taskWatcher.create({ data: { taskId, userId } });
  }

  async getWatchers(taskId: string) {
    return this.prisma.taskWatcher.findMany({ where: { taskId } });
  }

  async removeWatcher(taskId: string, userId: string) {
    return this.prisma.taskWatcher.deleteMany({ where: { taskId, userId } });
  }
}

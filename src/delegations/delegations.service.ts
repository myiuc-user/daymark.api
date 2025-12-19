import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DelegationsService {
  constructor(private prisma: PrismaService) {}

  async delegateTask(taskId: string, fromUserId: string, toUserId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: toUserId }
    });
  }

  async getDelegations(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId }
    });
  }
}

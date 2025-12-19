import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({ where: { userId } });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async sendToUser(userId: string, data: any) {
    return this.prisma.notification.create({
      data: { userId, ...data }
    });
  }
}

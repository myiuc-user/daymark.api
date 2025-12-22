import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const notifications = await this.prisma.notification.findMany({ 
      where: { 
        userId,
        read: false
      },
      orderBy: { createdAt: 'desc' }
    });
    return notifications || [];
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({ 
      where: { userId, read: false }, 
      data: { read: true } 
    });
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

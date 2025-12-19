import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  async findAll(taskId: string) {
    return this.prisma.timeEntry.findMany({ where: { taskId } });
  }

  async create(data: any) {
    return this.prisma.timeEntry.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.timeEntry.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.timeEntry.delete({ where: { id } });
  }

  async getSummary(taskId: string) {
    const entries = await this.prisma.timeEntry.findMany({ where: { taskId } });
    const total = entries.reduce((sum, e) => sum + e.hours, 0);
    return { total, entries };
  }
}

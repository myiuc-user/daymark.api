import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.task.findMany({ where: { projectId } });
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.task.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.task.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  async executeRecurringTasks() {
    // Implement recurring tasks logic
    return { message: 'Recurring tasks executed' };
  }
}

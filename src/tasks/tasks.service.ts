import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    const tasks = await this.prisma.task.findMany({ where: { projectId } });
    return tasks || [];
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async create(data: any, createdById: string) {
    const taskData = {
      ...data,
      createdById,
      // Si pas de due_date, c'est un TODO, sinon c'est une TASK
      type: !data.due_date ? 'TODO' : 'TASK',
      // Si pas de due_date, mettre une date par défaut dans 7 jours
      due_date: data.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    
    return this.prisma.task.create({ 
      data: taskData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
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

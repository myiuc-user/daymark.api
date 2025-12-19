import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SprintsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    const sprints = await this.prisma.sprint.findMany({ where: { projectId } });
    return sprints || [];
  }

  async create(data: any) {
    return this.prisma.sprint.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.sprint.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.sprint.delete({ where: { id } });
  }

  async activate(id: string) {
    return this.prisma.sprint.update({ where: { id }, data: { status: 'ACTIVE' } });
  }
}

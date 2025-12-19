import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    const milestones = await this.prisma.milestone.findMany({ where: { projectId } });
    return milestones || [];
  }

  async create(data: any) {
    return this.prisma.milestone.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.milestone.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.milestone.delete({ where: { id } });
  }
}

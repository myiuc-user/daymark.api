import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    const projects = await this.prisma.project.findMany({ where: { workspaceId } });
    return projects || [];
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.project.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.project.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}

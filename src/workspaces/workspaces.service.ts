import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: { members: { some: { userId } } }
    });
    return workspaces || [];
  }

  async findOne(id: string) {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.workspace.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.workspace.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.workspace.delete({ where: { id } });
  }
}

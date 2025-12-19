import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.projectTemplate.findMany();
  }

  async create(data: any) {
    return this.prisma.projectTemplate.create({ data });
  }

  async use(id: string, projectData: any) {
    const template = await this.prisma.projectTemplate.findUnique({ where: { id } });
    return this.prisma.project.create({ data: { ...template, ...projectData } });
  }

  async delete(id: string) {
    return this.prisma.projectTemplate.delete({ where: { id } });
  }
}

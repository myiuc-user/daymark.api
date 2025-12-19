import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: string) {
    const tasks = await this.prisma.task.findMany({
      where: { title: { contains: query, mode: 'insensitive' } }
    });
    const projects = await this.prisma.project.findMany({
      where: { name: { contains: query, mode: 'insensitive' } }
    });
    return { tasks, projects };
  }
}

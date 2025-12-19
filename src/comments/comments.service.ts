import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(taskId: string) {
    return this.prisma.comment.findMany({ where: { taskId } });
  }

  async create(data: any) {
    return this.prisma.comment.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.comment.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}

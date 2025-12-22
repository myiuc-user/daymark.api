import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(taskId: string) {
    const comments = await this.prisma.comment.findMany({ where: { taskId } });
    return comments || [];
  }

  async create(data: any) {
    // Filter out fields that don't exist in the Comment model
    const { mentions, ...createData } = data;
    return this.prisma.comment.create({ data: createData });
  }

  async update(id: string, data: any) {
    // Filter out fields that don't exist in the Comment model
    const { mentions, ...updateData } = data;
    return this.prisma.comment.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}

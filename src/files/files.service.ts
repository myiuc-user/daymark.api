import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async upload(data: any) {
    return this.prisma.file.create({ data });
  }

  async findOne(id: string) {
    return this.prisma.file.findUnique({ where: { id } });
  }

  async delete(id: string) {
    return this.prisma.file.delete({ where: { id } });
  }
}

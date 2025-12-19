import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.workspaceInvitation.findMany({ where: { workspaceId } });
  }

  async create(data: any) {
    return this.prisma.workspaceInvitation.create({ data });
  }

  async accept(id: string) {
    return this.prisma.workspaceInvitation.update({ where: { id }, data: { acceptedAt: new Date() } });
  }

  async reject(id: string) {
    return this.prisma.workspaceInvitation.delete({ where: { id } });
  }

  async delete(id: string) {
    return this.prisma.workspaceInvitation.delete({ where: { id } });
  }
}

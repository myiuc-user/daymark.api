import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.auditLog.findMany({ where: { userId } });
  }

  async create(data: any) {
    return this.prisma.auditLog.create({ data });
  }

  async getProjectAudit(projectId: string) {
    return this.prisma.auditLog.findMany({ where: { projectId } });
  }
}

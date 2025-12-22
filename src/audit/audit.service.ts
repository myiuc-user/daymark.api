import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async getLogs(limit: number = 50, offset: number = 0, userId: string) {
    // Get user with role
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let whereClause: any = {};

    if (user.role === 'SUPER_ADMIN') {
      // Super admin sees all logs
      whereClause = {};
    } else if (user.role === 'ADMIN') {
      // Admin sees logs from projects where they are admin/lead and their own logs
      const adminProjects = await this.prisma.project.findMany({
        where: {
          OR: [
            { team_lead: userId },
            { members: { some: { userId, role: 'ADMIN' } } }
          ]
        },
        select: { id: true }
      });
      
      const projectIds = adminProjects.map(p => p.id);
      const projectMembers = await this.prisma.projectMember.findMany({
        where: { projectId: { in: projectIds } },
        select: { userId: true }
      });
      
      const memberIds = [...new Set([userId, ...projectMembers.map(m => m.userId)])];
      whereClause = { userId: { in: memberIds } };
    } else {
      // Regular member sees only their own logs
      whereClause = { userId };
    }

    const logs = await this.prisma.auditLog.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { logs };
  }

  async create(data: any) {
    return this.prisma.auditLog.create({ data });
  }

  async getProjectAudit(projectId: string) {
    return this.prisma.auditLog.findMany({ 
      where: { 
        entity: 'Project',
        entityId: projectId 
      } 
    });
  }
}

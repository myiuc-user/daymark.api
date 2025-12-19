import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async getProjectPermissions(userId: string, projectId: string) {
    const projectMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId
        }
      },
      include: {
        project: {
          select: {
            team_lead: true,
            workspaceId: true
          }
        },
        user: {
          select: {
            role: true
          }
        }
      }
    });

    if (!projectMember) {
      return { permissions: [] };
    }

    const permissions = [];
    
    // Super admin has all permissions
    if (projectMember.user.role === 'SUPER_ADMIN') {
      permissions.push('PROJECT.CREATE', 'PROJECT.MANAGE_MEMBERS', 'PROJECT.DELETE');
    }
    
    // Project admin or team lead
    if (projectMember.role === 'ADMIN' || projectMember.project.team_lead === userId) {
      permissions.push('PROJECT.MANAGE_MEMBERS');
    }
    
    return { permissions };
  }
}

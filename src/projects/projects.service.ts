import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    const projects = await this.prisma.project.findMany({ where: { workspaceId } });
    return projects || [];
  }

  async findOne(id: string) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  async create(data: any) {
    const { team_members, ...projectData } = data;
    
    const project = await this.prisma.project.create({
      data: {
        ...projectData,
        members: team_members && Array.isArray(team_members) && team_members.length > 0 ? {
          create: team_members.map(userId => ({
            userId,
            role: userId === projectData.team_lead ? 'ADMIN' : 'MEMBER'
          }))
        } : undefined
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
    
    return project;
  }

  async update(id: string, data: any) {
    return this.prisma.project.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}

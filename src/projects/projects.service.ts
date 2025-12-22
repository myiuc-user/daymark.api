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
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            },
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (project) {
      // Add owner to members list if not already included
      const allMembers = [...project.members];
      const ownerIsMember = project.members.some(member => member.userId === project.team_lead);
      
      if (!ownerIsMember && project.owner) {
        allMembers.unshift({
          id: `owner-${project.owner.id}`,
          userId: project.owner.id,
          projectId: project.id,
          role: 'ADMIN',
          customPermissions: [],
          user: project.owner
        } as any);
      }
      
      return {
        ...project,
        members: allMembers,
        totalMembers: allMembers.length
      };
    }
    
    return project;
  }

  async create(data: any) {
    const { team_members, progress, ...projectData } = data;
    
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
    // Delete in cascade: tasks, comments, files, etc. will be deleted automatically due to Prisma schema constraints
    return this.prisma.project.delete({ where: { id } });
  }
}

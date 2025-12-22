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

  async create(data: any, userId: string) {
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
    
    // Create audit log entry
    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'PROJECT',
        entityId: project.id,
        userId,
        changes: { message: `Created project "${project.name}"`, workspaceId: project.workspaceId }
      }
    });
    
    return project;
  }

  async update(id: string, data: any, userId?: string) {
    const project = await this.prisma.project.update({ where: { id }, data });
    
    // Create audit log entry
    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'PROJECT',
          entityId: id,
          userId,
          changes: { message: `Updated project "${project.name}"`, workspaceId: project.workspaceId }
        }
      });
    }
    
    return project;
  }

  async delete(id: string, userId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error('Project not found');
    
    const result = await this.prisma.project.delete({ where: { id } });
    
    // Create audit log entry
    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entity: 'PROJECT',
          entityId: id,
          userId,
          changes: { message: `Deleted project "${project.name}"`, workspaceId: project.workspaceId }
        }
      });
    }
    
    return result;
  }

  async addMember(projectId: string, userId: string, role: string, addedById: string) {
    // Get project and user info
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!project || !user) {
      throw new Error('Project or user not found');
    }
    
    // Add member to project
    const member = await this.prisma.projectMember.create({
      data: {
        userId,
        projectId,
        role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    // Create audit log entry
    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'PROJECT_MEMBER_ADDED',
        entityId: member.id,
        userId: addedById,
        changes: {
          message: `Added ${user.name} (${user.email}) to project "${project.name}"`,
          projectId,
          addedMemberName: user.name,
          addedMemberEmail: user.email,
          role
        }
      }
    });
    
    return { member, message: 'Member added successfully' };
  }

  async removeMember(projectId: string, userId: string, removedById: string) {
    // Get member info before deletion
    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!member) {
      throw new Error('Member not found in project');
    }
    
    // Remove member from project
    await this.prisma.projectMember.delete({
      where: {
        id: member.id
      }
    });
    
    // Create audit log entry
    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'PROJECT_MEMBER_REMOVED',
        entityId: member.id,
        userId: removedById,
        changes: {
          message: `Removed ${member.user.name} (${member.user.email}) from project "${member.project.name}"`,
          projectId,
          removedMemberName: member.user.name,
          removedMemberEmail: member.user.email,
          role: member.role
        }
      }
    });
    
    return { message: 'Member removed successfully' };
  }
}

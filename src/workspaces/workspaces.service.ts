import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
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
    return workspaces || [];
  }

  async findOne(id: string) {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.prisma.workspace.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.workspace.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.workspace.delete({ where: { id } });
  }

  async getMembers(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });
    return members || [];
  }

  async getInvitations(workspaceId: string) {
    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return invitations || [];
  }

  async createInvitation(workspaceId: string, data: any, invitedById: string) {
    return this.prisma.workspaceInvitation.create({
      data: {
        ...data,
        workspaceId,
        invitedById
      }
    });
  }
}

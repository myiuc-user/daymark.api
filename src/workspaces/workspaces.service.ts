import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

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
    console.log('createInvitation data:', JSON.stringify(data, null, 2));
    
    const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
    const inviter = await this.prisma.user.findUnique({ where: { id: invitedById } });
    
    const invitations = await Promise.all(
      data.invitations.map(async (invitation: any) => {
        const token = Math.random().toString(36).substring(2, 15);
        const invitationData = {
          email: invitation.email,
          role: invitation.role,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          workspaceId,
          invitedById
        };
        
        console.log('Creating invitation with data:', JSON.stringify(invitationData, null, 2));
        
        const createdInvitation = await this.prisma.workspaceInvitation.create({
          data: invitationData
        });
        
        await this.emailService.sendInvitationEmail(
          invitation.email,
          token,
          workspace?.name || 'Workspace',
          inviter?.name || 'Someone'
        );
        
        return createdInvitation;
      })
    );
    return { invitations };
  }
}

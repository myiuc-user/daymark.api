import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async inviteMember(data: any) {
    return this.prisma.workspaceInvitation.create({ data });
  }

  async acceptInvitation(invitationId: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({ where: { id: invitationId } });
    if (!invitation) throw new Error('Invitation not found');
    await this.prisma.workspaceMember.create({
      data: { workspaceId: invitation.workspaceId, userId: invitation.email }
    });
    return this.prisma.workspaceInvitation.update({ where: { id: invitationId }, data: { acceptedAt: new Date() } });
  }

  async assignProjectRole(data: any) {
    return this.prisma.projectMember.create({ data });
  }

  async assignMultiple(data: { userIds: string[]; projectId: string; role?: ProjectRole }) {
    const results = await Promise.all(data.userIds.map((userId: string) =>
      this.prisma.projectMember.create({ data: { projectId: data.projectId, userId, role: data.role || ProjectRole.MEMBER } })
    ));
    return results || [];
  }
}

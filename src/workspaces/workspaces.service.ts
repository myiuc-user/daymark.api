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
        owner: {
          select: { id: true, name: true, email: true, image: true, role: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    // Include owner in members count for each workspace
    const workspacesWithMembers = workspaces.map(workspace => {
      const allMembers = [];
      
      if (workspace.owner) {
        allMembers.push({
          id: `owner-${workspace.owner.id}`,
          userId: workspace.owner.id,
          workspaceId: workspace.id,
          role: 'ADMIN',
          user: workspace.owner,
          isOwner: true
        });
      }
      
      workspace.members.forEach(member => {
        if (member.userId !== workspace.ownerId) {
          allMembers.push({
            ...member,
            isOwner: false
          });
        }
      });

      return {
        ...workspace,
        members: allMembers
      };
    });

    return { workspaces: workspacesWithMembers || [] };
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true, role: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true, role: true }
            }
          }
        }
      }
    });

    if (!workspace) return null;

    // Include owner in members list
    const allMembers = [];
    
    if (workspace.owner) {
      allMembers.push({
        id: `owner-${workspace.owner.id}`,
        userId: workspace.owner.id,
        workspaceId: id,
        role: 'ADMIN',
        user: workspace.owner,
        isOwner: true
      });
    }
    
    workspace.members.forEach(member => {
      if (member.userId !== workspace.ownerId) {
        allMembers.push({
          ...member,
          isOwner: false
        });
      }
    });

    return {
      workspace: {
        ...workspace,
        members: allMembers
      }
    };
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
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true, role: true }
        }
      }
    });

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true }
        }
      }
    });

    const allMembers = [];
    
    // Add owner as first member with ADMIN role
    if (workspace?.owner) {
      allMembers.push({
        id: `owner-${workspace.owner.id}`,
        userId: workspace.owner.id,
        workspaceId,
        role: 'ADMIN',
        user: workspace.owner,
        isOwner: true
      });
    }
    
    // Add regular members (excluding owner if they're also in members table)
    members.forEach(member => {
      if (member.userId !== workspace?.ownerId) {
        allMembers.push({
          ...member,
          isOwner: false
        });
      }
    });
    
    return { members: allMembers };
  }

  async getInvitations(workspaceId: string) {
    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    return invitations || [];
  }

  async createInvitation(workspaceId: string, data: any, invitedById: string) {
    try {
      console.log('createInvitation called with:', {
        workspaceId,
        data: JSON.stringify(data, null, 2),
        invitedById
      });
      
      if (!data.invitations || !Array.isArray(data.invitations)) {
        throw new Error('Invalid invitations data: must be an array');
      }
      
      const workspace = await this.prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }
      
      const inviter = await this.prisma.user.findUnique({ where: { id: invitedById } });
      if (!inviter) {
        throw new Error(`Inviter not found: ${invitedById}`);
      }
      
      const invitations = await Promise.all(
        data.invitations.map(async (invitation: any) => {
          if (!invitation.email || !invitation.role) {
            throw new Error('Invalid invitation: email and role are required');
          }
          
          const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
          
          // Create audit log entry - logged under the inviter's account
          await this.prisma.auditLog.create({
            data: {
              action: 'CREATE',
              entity: 'MEMBER_INVITATION',
              entityId: createdInvitation.id,
              userId: invitedById, // Log under inviter's account
              changes: { 
                message: `Invited ${invitation.email} to workspace "${workspace.name}"`,
                workspaceId,
                invitedEmail: invitation.email,
                role: invitation.role
              }
            }
          });
          
          try {
            await this.emailService.sendInvitationEmail(
              invitation.email,
              token,
              workspace.name,
              inviter.name
            );
            console.log(`Email sent successfully to ${invitation.email}`);
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the invitation creation if email fails
          }
          
          return createdInvitation;
        })
      );
      
      console.log(`Successfully created ${invitations.length} invitations`);
      return { invitations };
    } catch (error) {
      console.error('Error in createInvitation:', error);
      throw error;
    }
  }

  async removeMember(workspaceId: string, memberUserId: string, removedById: string) {
    // Get member info before deletion
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: memberUserId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        workspace: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!member) {
      throw new Error('Member not found in workspace');
    }
    
    // Remove member from workspace
    await this.prisma.workspaceMember.delete({
      where: {
        id: member.id
      }
    });
    
    // Create audit log entry - logged under the remover's account
    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'MEMBER_REMOVED',
        entityId: member.id,
        userId: removedById, // Log under remover's account
        changes: {
          message: `Removed ${member.user.name} (${member.user.email}) from workspace "${member.workspace.name}"`,
          workspaceId,
          removedMemberName: member.user.name,
          removedMemberEmail: member.user.email,
          role: member.role
        }
      }
    });
    
    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(workspaceId: string, memberUserId: string, newRole: string, updatedById: string) {
    // Get member info
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: memberUserId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        workspace: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!member) {
      throw new Error('Member not found in workspace');
    }
    
    const oldRole = member.role;
    
    // Update member role
    const updatedMember = await this.prisma.workspaceMember.update({
      where: {
        id: member.id
      },
      data: {
        role: newRole
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
        action: 'UPDATE',
        entity: 'MEMBER_ROLE_UPDATED',
        entityId: member.id,
        userId: updatedById,
        changes: {
          message: `Updated ${member.user.name}'s role from ${oldRole} to ${newRole} in workspace "${member.workspace.name}"`,
          workspaceId,
          memberName: member.user.name,
          memberEmail: member.user.email,
          oldRole,
          newRole
        }
      }
    });
    
    return { member: updatedMember, message: 'Member role updated successfully' };
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { name: true, email: true } }
      }
    });
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    return { invitation };
  }

  async acceptInvitation(token: string, data: { name: string; password: string }) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true }
    });
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    if (invitation.acceptedAt) {
      throw new Error('Invitation already accepted');
    }
    
    // Create user account
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: invitation.email,
        password: hashedPassword
      }
    });
    
    // Add user to workspace
    const member = await this.prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role
      }
    });
    
    // Create audit log entry - logged under the inviter's account (not the new member)
    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'MEMBER_JOINED',
        entityId: member.id,
        userId: invitation.invitedById, // Log under inviter's account
        changes: { 
          message: `${user.name} (${user.email}) joined workspace "${invitation.workspace.name}"`,
          workspaceId: invitation.workspaceId,
          newMemberName: user.name,
          newMemberEmail: user.email,
          role: invitation.role
        }
      }
    });
    
    // Mark invitation as accepted
    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });
    
    return { message: 'Invitation accepted successfully', user: { id: user.id, name: user.name, email: user.email } };
  }
}

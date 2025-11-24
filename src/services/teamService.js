import { prisma } from '../app.js';
import { sendInvitationEmail } from './emailService.js';
import crypto from 'crypto';

export const teamService = {
  // Inviter un membre dans un workspace
  async inviteToWorkspace(workspaceId, email, role, invitedById) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
    
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        email,
        token,
        role,
        workspaceId,
        invitedById,
        expiresAt
      },
      include: {
        workspace: true,
        invitedBy: true
      }
    });
    
    // Envoyer l'email d'invitation
    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}`;
    await sendInvitationEmail(invitation.email, invitation.workspace.name, inviteLink);
    
    return invitation;
  },

  // Accepter une invitation
  async acceptInvitation(token) {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true }
    });
    
    if (!invitation || invitation.expiresAt < new Date()) {
      throw new Error('Invitation invalide ou expirée');
    }
    
    if (invitation.acceptedAt) {
      throw new Error('Invitation déjà acceptée');
    }
    
    // Vérifier si l'utilisateur existe
    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Ajouter le membre au workspace
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role
      }
    });
    
    // Marquer l'invitation comme acceptée
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });
    
    return { user, workspace: invitation.workspace };
  },

  // Gérer les rôles dans un projet
  async assignProjectRole(projectId, userId, role) {
    return await prisma.projectMember.upsert({
      where: {
        userId_projectId: { userId, projectId }
      },
      update: { role },
      create: { userId, projectId, role },
      include: { user: true }
    });
  },

  // Assigner multiple utilisateurs à une tâche
  async assignMultipleToTask(taskId, userIds) {
    // Pour l'instant, on garde un seul assigné mais on ajoute les autres comme watchers
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    
    if (userIds.length > 0) {
      // Assigner le premier utilisateur
      await prisma.task.update({
        where: { id: taskId },
        data: { assigneeId: userIds[0] }
      });
      
      // Ajouter les autres comme watchers
      for (let i = 1; i < userIds.length; i++) {
        await prisma.taskWatcher.upsert({
          where: {
            userId_taskId: { userId: userIds[i], taskId }
          },
          update: {},
          create: { userId: userIds[i], taskId }
        });
      }
    }
    
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        watchers: { include: { user: true } }
      }
    });
  }
};
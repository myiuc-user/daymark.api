import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getProjectAnalytics(projectId: string) {
    const tasks = await this.prisma.task.findMany({ where: { projectId } }) || [];
    const completed = tasks.filter(t => t.status === 'DONE').length;
    return { total: tasks.length, completed, percentage: tasks.length > 0 ? (completed / tasks.length) * 100 : 0 };
  }

  async getTeamAnalytics(workspaceId: string) {
    const projects = await this.prisma.project.findMany({ where: { workspaceId } }) || [];
    return { totalProjects: projects.length };
  }

  async getDashboardAnalytics(workspaceId: string) {
    const [projects, tasks, members] = await Promise.all([
      this.prisma.project.findMany({ where: { workspaceId } }),
      this.prisma.task.findMany({ where: { project: { workspaceId } } }),
      this.prisma.workspaceMember.findMany({ where: { workspaceId } })
    ]);
    
    const projectsList = projects || [];
    const tasksList = tasks || [];
    const membersList = members || [];
    const completedTasks = tasksList.filter(t => t.status === 'DONE').length;
    
    return {
      totalProjects: projectsList.length,
      totalTasks: tasksList.length,
      completedTasks,
      totalMembers: membersList.length,
      completionRate: tasksList.length > 0 ? (completedTasks / tasksList.length) * 100 : 0
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getProjectAnalytics(projectId: string) {
    const tasks = await this.prisma.task.findMany({ where: { projectId } });
    const completed = tasks.filter(t => t.status === 'DONE').length;
    return { total: tasks.length, completed, percentage: (completed / tasks.length) * 100 };
  }

  async getTeamAnalytics(workspaceId: string) {
    const projects = await this.prisma.project.findMany({ where: { workspaceId } });
    return { totalProjects: projects.length };
  }

  async getDashboardAnalytics(workspaceId: string) {
    const [projects, tasks, members] = await Promise.all([
      this.prisma.project.findMany({ where: { workspaceId } }),
      this.prisma.task.findMany({ where: { project: { workspaceId } } }),
      this.prisma.workspaceMember.findMany({ where: { workspaceId } })
    ]);
    
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      completedTasks,
      totalMembers: members.length,
      completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
    };
  }
}

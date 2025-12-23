import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getProjectAnalytics(projectId: string) {
    const tasks = await this.prisma.task.findMany({ where: { projectId } }) || [];
    const completed = tasks.filter(t => t.status === 'DONE').length;
    return { total: tasks.length, completed, percentage: tasks.length > 0 ? Math.round((completed / tasks.length) * 100 * 10) / 10 : 0 };
  }

  async getTeamAnalytics(workspaceId: string) {
    const projects = await this.prisma.project.findMany({ where: { workspaceId } }) || [];
    return { totalProjects: projects.length };
  }

  async getDashboardAnalytics(workspaceId: string) {
    const [projects, tasks, members, workspace] = await Promise.all([
      this.prisma.project.findMany({ where: { workspaceId } }),
      this.prisma.task.findMany({ where: { project: { workspaceId } } }),
      this.prisma.workspaceMember.findMany({ where: { workspaceId } }),
      this.prisma.workspace.findUnique({ where: { id: workspaceId } })
    ]);
    
    const projectsList = projects || [];
    const tasksList = tasks || [];
    const membersList = members || [];
    const completedTasks = tasksList.filter(t => t.status === 'DONE').length;
    
    // Include workspace owner in total members count
    const totalMembers = membersList.length + (workspace ? 1 : 0);
    
    return {
      totalProjects: projectsList.length,
      totalTasks: tasksList.length,
      completedTasks,
      totalMembers,
      completionRate: tasksList.length > 0 ? Math.round((completedTasks / tasksList.length) * 100 * 10) / 10 : 0
    };
  }
}

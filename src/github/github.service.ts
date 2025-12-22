import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GithubService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string) {
    try {
      // Check if user has GitHub token
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { githubToken: true }
      });

      if (!user?.githubToken) {
        return { connected: false, repo: null, user: null };
      }

      // Get connected repositories
      const projects = await this.prisma.project.findMany({
        where: {
          members: {
            some: { userId }
          },
          githubRepo: { not: null }
        },
        select: {
          id: true,
          name: true,
          githubRepo: true
        }
      });

      return {
        connected: true,
        user: user.githubToken ? 'Connected' : null,
        repositories: projects
      };
    } catch (error) {
      return { connected: false, repo: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async authenticate(code: string) {
    // Implement GitHub OAuth
    return { message: 'GitHub authentication' };
  }

  async syncIssues(projectId: string) {
    // Implement issue sync
    return { message: 'Issues synced' };
  }
}

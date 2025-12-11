import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import prisma from '../config/prisma.js';
import { taskService } from './taskService.js';

class GitHubService {
  constructor() {
    this.git = simpleGit();
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
  }

  getOctokit(token) {
    return new Octokit({ 
      auth: token,
      request: {
        timeout: 10000,
        retries: 3
      }
    });
  }

  // Auth methods
  getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${process.env.FRONTEND_URL}/auth/github/callback`,
      scope: 'repo,user:email',
      state
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async getAccessToken(code) {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || 'GitHub OAuth error');
    }
    return data.access_token;
  }

  async getUserInfo(token) {
    const octokit = this.getOctokit(token);
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
  }

  async saveUserToken(userId, token, githubUser) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        githubToken: token,
        githubUsername: githubUser.login,
        githubData: githubUser
      }
    });
  }

  async getUserToken(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { githubToken: true, githubUsername: true }
    });
    return user?.githubToken;
  }

  async hasUserToken(userId) {
    const token = await this.getUserToken(userId);
    return !!token;
  }

  async removeUserToken(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        githubToken: null,
        githubUsername: null,
        githubData: null
      }
    });
  }

  // Repository methods
  async getUserRepos(token) {
    try {
      const octokit = this.getOctokit(token);
      
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({ 
        per_page: 100,
        sort: 'updated'
      });
      
      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count
      }));
    } catch (error) {
      console.error(`[GitHubService] Error fetching repos:`, error);
      throw new Error(`Failed to fetch user repos: ${error.message}`);
    }
  }

  async getUserOrganizations(token) {
    try {
      const octokit = this.getOctokit(token);
      
      const { data: userOrgs } = await octokit.rest.orgs.listForAuthenticatedUser({ per_page: 100 });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      
      return [
        {
          id: user.id,
          login: user.login,
          name: user.name || user.login,
          avatar_url: user.avatar_url,
          type: 'User'
        },
        ...userOrgs.map(org => ({
          id: org.id,
          login: org.login,
          name: org.name || org.login,
          avatar_url: org.avatar_url,
          type: 'Organization'
        }))
      ];
    } catch (error) {
      console.error(`[GitHubService] Error fetching organizations:`, error);
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }
  }

  async getOrganizationRepos(org, token) {
    try {
      const octokit = this.getOctokit(token);
      
      const { data } = await octokit.rest.repos.listForOrg({
        org,
        per_page: 100,
        sort: 'updated'
      });
      
      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count
      }));
    } catch (error) {
      console.error(`[GitHubService] Error fetching org repos:`, error);
      throw new Error(`Failed to fetch organization repos: ${error.message}`);
    }
  }

  async getRepoInfo(owner, repo, token) {
    try {
      const octokit = this.getOctokit(token);
      const { data } = await octokit.rest.repos.get({ owner, repo });
      
      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        language: data.language,
        size: data.size,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count
      };
    } catch (error) {
      console.error(`[GitHubService] Error fetching repo info:`, error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async getCodeMetrics(owner, repo, token) {
    try {
      const octokit = this.getOctokit(token);
      const { data: languages } = await octokit.rest.repos.listLanguages({ owner, repo });
      
      const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
      const estimatedLOC = Math.round(totalBytes / 50);
      
      return {
        languages,
        totalBytes,
        estimatedLOC,
        primaryLanguage: Object.keys(languages)[0] || 'Unknown'
      };
    } catch (error) {
      console.error(`[GitHubService] Error fetching code metrics:`, error);
      throw new Error(`Failed to get code metrics: ${error.message}`);
    }
  }

  async searchRepos(q, token) {
    try {
      const octokit = this.getOctokit(token);
      const { data } = await octokit.rest.search.repos({ q, per_page: 30 });
      
      return data.items.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count
      }));
    } catch (error) {
      console.error(`[GitHubService] Error searching repos:`, error);
      throw new Error(`Failed to search repos: ${error.message}`);
    }
  }

  // Commit methods
  async getProjectCommits(projectId, userId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project?.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = project.githubRepo.split('/');
    const octokit = this.getOctokit(user.githubToken);

    const { data } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 50
    });

    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date
    }));
  }

  async linkTaskToCommit(taskId, commitHash, userId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) throw new Error('Task not found');
    if (!task.project.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = task.project.githubRepo.split('/');
    const octokit = this.getOctokit(user.githubToken);

    const commit = await octokit.repos.getCommit({ owner, repo, ref: commitHash });

    return await prisma.task.update({
      where: { id: taskId },
      data: {
        commitHash,
        commitMessage: commit.data.commit.message
      },
      include: { project: true }
    });
  }

  async updateCommitMessage(taskId, userId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task?.commitHash) throw new Error('Task not linked to commit');
    if (!task.project.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = task.project.githubRepo.split('/');
    const octokit = this.getOctokit(user.githubToken);

    const newMessage = task.title;

    try {
      await octokit.repos.createCommitComment({
        owner,
        repo,
        commit_sha: task.commitHash,
        body: `Task: ${newMessage}`
      });
    } catch (error) {
      console.error('Failed to add commit comment:', error);
    }

    return await prisma.task.update({
      where: { id: taskId },
      data: { commitMessage: newMessage }
    });
  }

  async unlinkTaskFromCommit(taskId) {
    return await prisma.task.update({
      where: { id: taskId },
      data: { commitHash: null, commitMessage: null }
    });
  }

  // Sync methods
  async syncGitHubIssues(projectId, userId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true }
    });

    if (!project?.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = project.githubRepo.split('/');
    const octokit = this.getOctokit(user.githubToken);

    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100
    });

    const syncedTasks = [];

    for (const issue of issues) {
      const existingTask = await prisma.task.findFirst({
        where: {
          projectId,
          description: { contains: `github-issue-${issue.number}` }
        }
      });

      if (!existingTask) {
        const task = await taskService.createTask({
          title: issue.title,
          description: `${issue.body}\n\ngithub-issue-${issue.number}`,
          projectId,
          priority: 'MEDIUM',
          status: issue.state === 'closed' ? 'DONE' : 'TODO',
          dueDate: issue.due_on ? new Date(issue.due_on) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdById: project.team_lead,
          assigneeId: project.team_lead
        }, userId);

        syncedTasks.push(task);
      } else {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            status: issue.state === 'closed' ? 'DONE' : 'TODO',
            title: issue.title
          }
        });
      }
    }

    return syncedTasks;
  }

  async createGitHubIssueFromTask(taskId, userId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task?.project.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = task.project.githubRepo.split('/');
    const octokit = this.getOctokit(user.githubToken);

    const { data: issue } = await octokit.issues.create({
      owner,
      repo,
      title: task.title,
      body: task.description || ''
    });

    await prisma.task.update({
      where: { id: taskId },
      data: {
        description: `${task.description}\n\ngithub-issue-${issue.number}`
      }
    });

    return issue;
  }

  async updateGitHubIssueFromTask(taskId, userId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task?.project.githubRepo) throw new Error('Project not linked to GitHub');

    const issueMatch = task.description?.match(/github-issue-(\d+)/);
    if (!issueMatch) throw new Error('Task not linked to GitHub issue');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = task.project.githubRepo.split('/');
    const issueNumber = parseInt(issueMatch[1]);
    const octokit = this.getOctokit(user.githubToken);

    const statusMap = {
      'TODO': 'open',
      'IN_PROGRESS': 'open',
      'DONE': 'closed'
    };

    const { data: issue } = await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      title: task.title,
      body: task.description?.replace(/\n\ngithub-issue-\d+/, '') || '',
      state: statusMap[task.status] || 'open'
    });

    return issue;
  }
}

export const githubService = new GitHubService();

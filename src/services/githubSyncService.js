import { Octokit } from '@octokit/rest';
import prisma from '../config/prisma.js';
import { taskService } from './taskService.js';

export const githubSyncService = {
  syncGitHubIssues: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true }
    });

    if (!project?.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = project.githubRepo.split('/');
    const octokit = new Octokit({ auth: user.githubToken });

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
  },

  createGitHubIssueFromTask: async (taskId, userId) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task?.project.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = task.project.githubRepo.split('/');
    const octokit = new Octokit({ auth: user.githubToken });

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
  },

  updateGitHubIssueFromTask: async (taskId, userId) => {
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
    const octokit = new Octokit({ auth: user.githubToken });

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
  },

  syncGitHubIssueToTask: async (projectId, issueNumber, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project?.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = project.githubRepo.split('/');
    const octokit = new Octokit({ auth: user.githubToken });

    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });

    const task = await prisma.task.findFirst({
      where: {
        projectId,
        description: { contains: `github-issue-${issueNumber}` }
      }
    });

    if (task) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: issue.state === 'closed' ? 'DONE' : 'TODO',
          title: issue.title
        }
      });
    }

    return task;
  }
};

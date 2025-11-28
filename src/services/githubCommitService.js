import { Octokit } from '@octokit/rest';
import prisma from '../config/prisma.js';

export const githubCommitService = {
  linkTaskToCommit: async (taskId, commitHash, userId) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) throw new Error('Task not found');
    if (!task.project.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = task.project.githubRepo.split('/');
    const octokit = new Octokit({ auth: user.githubToken });

    const commit = await octokit.repos.getCommit({ owner, repo, ref: commitHash });

    return await prisma.task.update({
      where: { id: taskId },
      data: {
        commitHash,
        commitMessage: commit.data.commit.message
      },
      include: { project: true }
    });
  },

  updateCommitMessage: async (taskId, userId) => {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task?.commitHash) throw new Error('Task not linked to commit');
    if (!task.project.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = task.project.githubRepo.split('/');
    const octokit = new Octokit({ auth: user.githubToken });

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
  },

  unlinkTaskFromCommit: async (taskId) => {
    return await prisma.task.update({
      where: { id: taskId },
      data: { commitHash: null, commitMessage: null }
    });
  },

  getProjectCommits: async (projectId, userId) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project?.githubRepo) throw new Error('Project not linked to GitHub');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.githubToken) throw new Error('GitHub token not found');

    const [owner, repo] = project.githubRepo.split('/');
    const octokit = new Octokit({ auth: user.githubToken });

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
};

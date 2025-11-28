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

    await octokit.repos.updateCommitComment({
      owner,
      repo,
      commit_sha: task.commitHash,
      message: task.title
    });

    return await prisma.task.update({
      where: { id: taskId },
      data: { commitMessage: task.title }
    });
  },

  unlinkTaskFromCommit: async (taskId) => {
    return await prisma.task.update({
      where: { id: taskId },
      data: { commitHash: null, commitMessage: null }
    });
  }
};

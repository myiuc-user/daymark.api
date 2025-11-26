import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class GitHubService {
  constructor() {
    this.git = simpleGit();
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
      throw new Error(`Failed to fetch user repos: ${error.message}`);
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
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async getCommits(owner, repo, token, since = null) {
    try {
      const octokit = this.getOctokit(token);
      const params = { owner, repo, per_page: 100 };
      if (since) params.since = since;
      
      const { data } = await octokit.rest.repos.listCommits(params);
      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
        files: commit.files?.length || 0
      }));
    } catch (error) {
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  async getCodeMetrics(owner, repo, token) {
    try {
      const octokit = this.getOctokit(token);
      const { data: languages } = await octokit.rest.repos.listLanguages({ owner, repo });
      const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
      
      // Estimate lines of code (rough approximation: 1 line = 50 bytes average)
      const estimatedLOC = Math.round(totalBytes / 50);
      
      return {
        languages,
        totalBytes,
        estimatedLOC,
        primaryLanguage: Object.keys(languages)[0] || 'Unknown'
      };
    } catch (error) {
      throw new Error(`Failed to get code metrics: ${error.message}`);
    }
  }

  calculateCOCOMO(linesOfCode, complexity = 'ORGANIC') {
    const coefficients = {
      ORGANIC: { a: 2.4, b: 1.05, c: 2.5, d: 0.38 },
      SEMI_DETACHED: { a: 3.0, b: 1.12, c: 2.5, d: 0.35 },
      EMBEDDED: { a: 3.6, b: 1.20, c: 2.5, d: 0.32 }
    };
    
    const { a, b, c, d } = coefficients[complexity];
    const kloc = linesOfCode / 1000;
    
    const effort = a * Math.pow(kloc, b);
    const time = c * Math.pow(effort, d);
    const people = effort / time;
    
    return {
      effort: Math.round(effort * 10) / 10,
      developmentTime: Math.round(time * 10) / 10,
      averageTeamSize: Math.round(people * 10) / 10,
      estimatedCost: Math.round(effort * 8000)
    };
  }
}

export const githubService = new GitHubService();

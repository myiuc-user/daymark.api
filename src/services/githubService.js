import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import prisma from '../config/prisma.js';

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
      console.log(`[GitHubService] Initializing Octokit...`);
      const octokit = this.getOctokit(token);
      
      console.log(`[GitHubService] Fetching authenticated user repos...`);
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({ 
        per_page: 100,
        sort: 'updated'
      });
      
      console.log(`[GitHubService] Raw data received: ${data.length} repos`);
      
      const mapped = data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count
      }));
      
      console.log(`[GitHubService] Mapped repos:`, JSON.stringify(mapped.slice(0, 2), null, 2));
      return mapped;
    } catch (error) {
      console.error(`[GitHubService] Error fetching repos:`, error);
      throw new Error(`Failed to fetch user repos: ${error.message}`);
    }
  }

  async getUserOrganizations(token) {
    try {
      console.log(`[GitHubService] Fetching user organizations...`);
      const octokit = this.getOctokit(token);
      
      const { data: userOrgs } = await octokit.rest.orgs.listForAuthenticatedUser({ per_page: 100 });
      
      const { data: user } = await octokit.rest.users.getAuthenticated();
      
      const orgs = [
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
      
      console.log(`[GitHubService] Fetched ${orgs.length} organizations`);
      return orgs;
    } catch (error) {
      console.error(`[GitHubService] Error fetching organizations:`, error);
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }
  }

  async getOrganizationRepos(org, token) {
    try {
      console.log(`[GitHubService] Fetching repos for organization: ${org}`);
      const octokit = this.getOctokit(token);
      
      const { data } = await octokit.rest.repos.listForOrg({
        org,
        per_page: 100,
        sort: 'updated'
      });
      
      const mapped = data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count
      }));
      
      console.log(`[GitHubService] Fetched ${mapped.length} repos for org: ${org}`);
      return mapped;
    } catch (error) {
      console.error(`[GitHubService] Error fetching org repos:`, error);
      throw new Error(`Failed to fetch organization repos: ${error.message}`);
    }
  }

  async getRepoInfo(owner, repo, token) {
    try {
      console.log(`[GitHubService] Fetching repo info: ${owner}/${repo}`);
      const octokit = this.getOctokit(token);
      const { data } = await octokit.rest.repos.get({ owner, repo });
      
      const info = {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        language: data.language,
        size: data.size,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count
      };
      
      console.log(`[GitHubService] Repo info:`, JSON.stringify(info, null, 2));
      return info;
    } catch (error) {
      console.error(`[GitHubService] Error fetching repo info:`, error);
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async getCommits(owner, repo, token, since = null) {
    try {
      console.log(`[GitHubService] Fetching commits: ${owner}/${repo}`);
      const octokit = this.getOctokit(token);
      const params = { owner, repo, per_page: 100 };
      if (since) params.since = since;
      
      const { data } = await octokit.rest.repos.listCommits(params);
      console.log(`[GitHubService] Fetched ${data.length} commits`);
      
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
      console.error(`[GitHubService] Error fetching commits:`, error);
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  async getCodeMetrics(owner, repo, token) {
    try {
      console.log(`[GitHubService] Fetching code metrics: ${owner}/${repo}`);
      const octokit = this.getOctokit(token);
      const { data: languages } = await octokit.rest.repos.listLanguages({ owner, repo });
      
      console.log(`[GitHubService] Languages:`, JSON.stringify(languages, null, 2));
      
      const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
      const estimatedLOC = Math.round(totalBytes / 50);
      
      const metrics = {
        languages,
        totalBytes,
        estimatedLOC,
        primaryLanguage: Object.keys(languages)[0] || 'Unknown'
      };
      
      console.log(`[GitHubService] Metrics:`, JSON.stringify(metrics, null, 2));
      return metrics;
    } catch (error) {
      console.error(`[GitHubService] Error fetching code metrics:`, error);
      throw new Error(`Failed to get code metrics: ${error.message}`);
    }
  }

  async searchRepos(q, token) {
    try {
      console.log(`[GitHubService] Searching repos: ${q}`);
      const octokit = this.getOctokit(token);
      const { data } = await octokit.rest.search.repos({ q, per_page: 30 });
      
      console.log(`[GitHubService] Search returned ${data.items.length} items`);
      
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

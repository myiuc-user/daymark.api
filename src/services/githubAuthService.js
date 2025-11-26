import { Octokit } from '@octokit/rest';
import prisma from '../config/prisma.js';

class GitHubAuthService {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
  }

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
    console.log(`[GitHubAuthService] Exchanging code for token...`);
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
    console.log(`[GitHubAuthService] Response:`, data);
    
    if (data.error) {
      throw new Error(data.error_description || 'GitHub OAuth error');
    }
    return data.access_token;
  }

  async getUserInfo(token) {
    console.log(`[GitHubAuthService] Fetching user info...`);
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.users.getAuthenticated();
    console.log(`[GitHubAuthService] User info:`, data);
    return data;
  }

  async saveUserToken(userId, token, githubUser) {
    console.log(`[GitHubAuthService] Saving token for user: ${userId}`);
    console.log(`[GitHubAuthService] GitHub user: ${githubUser.login}`);
    
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        githubToken: token,
        githubUsername: githubUser.login,
        githubData: githubUser
      }
    });
    
    console.log(`[GitHubAuthService] User updated:`, {
      id: updated.id,
      githubUsername: updated.githubUsername,
      githubToken: updated.githubToken ? 'SET' : 'NOT SET'
    });
  }

  async getUserToken(userId) {
    console.log(`[GitHubAuthService] Getting token for user: ${userId}`);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { githubToken: true, githubUsername: true }
    });
    console.log(`[GitHubAuthService] User found:`, user);
    return user?.githubToken;
  }

  async hasUserToken(userId) {
    const token = await this.getUserToken(userId);
    return !!token;
  }

  async removeUserToken(userId) {
    console.log(`[GitHubAuthService] Removing token for user: ${userId}`);
    await prisma.user.update({
      where: { id: userId },
      data: {
        githubToken: null,
        githubUsername: null,
        githubData: null
      }
    });
    console.log(`[GitHubAuthService] Token removed`);
  }
}

export const githubAuthService = new GitHubAuthService();

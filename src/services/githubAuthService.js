import { Octokit } from '@octokit/rest';
import { prisma } from '../app.js';

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

  async exchangeCodeForToken(code) {
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
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
  }

  async storeUserToken(userId, token, githubUser) {
    await prisma.user.update({
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
      select: { githubToken: true }
    });
    return user?.githubToken;
  }
}

export const githubAuthService = new GitHubAuthService();
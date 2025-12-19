import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GithubService } from './github.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('github')
export class GithubController {
  constructor(private githubService: GithubService) {}

  @Post('auth')
  authenticate(@Body() body: { code: string }) {
    return this.githubService.authenticate(body.code);
  }

  @Post('sync')
  @UseGuards(JwtGuard)
  syncIssues(@Body() body: { projectId: string }) {
    return this.githubService.syncIssues(body.projectId);
  }
}

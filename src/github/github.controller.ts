import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { GithubService } from './github.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('github')
export class GithubController {
  constructor(private githubService: GithubService) {}

  @Get('status')
  @UseGuards(JwtGuard)
  getStatus(@CurrentUser() user: any) {
    return this.githubService.getStatus(user.id);
  }

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

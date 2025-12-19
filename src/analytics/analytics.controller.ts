import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('analytics')
@UseGuards(JwtGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('project/:id')
  getProjectAnalytics(@Param('id') id: string) {
    return this.analyticsService.getProjectAnalytics(id);
  }

  @Get('team/:workspaceId')
  getTeamAnalytics(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getTeamAnalytics(workspaceId);
  }

  @Get('dashboard/:id')
  getDashboardAnalytics(@Param('id') id: string) {
    return this.analyticsService.getDashboardAnalytics(id);
  }
}

import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects')
@UseGuards(JwtGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.projectsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    return this.projectsService.create(data, user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.projectsService.update(id, data, user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.delete(id, user.id);
  }

  @Post(':id/members')
  addMember(@Param('id') projectId: string, @Body() data: { userId: string; role?: string }, @CurrentUser() user: any) {
    return this.projectsService.addMember(projectId, data.userId, data.role || 'MEMBER', user.id);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') projectId: string, @Param('userId') userId: string, @CurrentUser() user: any) {
    return this.projectsService.removeMember(projectId, userId, user.id);
  }
}

import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('workspaces')
@UseGuards(JwtGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.workspacesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    return this.workspacesService.create({ ...data, ownerId: user.id });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.workspacesService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.workspacesService.delete(id);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.workspacesService.getMembers(id);
  }

  @Get(':id/invitations')
  getInvitations(@Param('id') id: string) {
    return this.workspacesService.getInvitations(id);
  }
}

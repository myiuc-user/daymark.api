import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

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

  @Post(':id/invitations')
  async createInvitation(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    try {
      console.log('Controller received invitation request:', {
        workspaceId: id,
        userId: user.id,
        data: JSON.stringify(data, null, 2)
      });
      
      const result = await this.workspacesService.createInvitation(id, data, user.id);
      console.log('Controller returning result:', result);
      return result;
    } catch (error) {
      console.error('Controller error:', error);
      throw error;
    }
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') workspaceId: string, @Param('userId') userId: string, @CurrentUser() user: any) {
    return this.workspacesService.removeMember(workspaceId, userId, user.id);
  }

  @Public()
  @Get('invitation/:token')
  getInvitationByToken(@Param('token') token: string) {
    return this.workspacesService.getInvitationByToken(token);
  }

  @Public()
  @Post('accept-invitation/:token')
  acceptInvitation(@Param('token') token: string, @Body() data: any) {
    return this.workspacesService.acceptInvitation(token, data);
  }
}

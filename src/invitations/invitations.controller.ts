import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('invitations')
@UseGuards(JwtGuard)
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.invitationsService.findAll(workspaceId);
  }

  @Post()
  create(@Body() data: any) {
    return this.invitationsService.create(data);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.invitationsService.accept(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.invitationsService.reject(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.invitationsService.delete(id);
  }
}

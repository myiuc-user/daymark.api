import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('collaboration')
@UseGuards(JwtGuard)
export class CollaborationController {
  constructor(private collaborationService: CollaborationService) {}

  @Post('mentions')
  createMention(@Body() data: any) {
    return this.collaborationService.createMention(data);
  }

  @Post('watchers/:taskId')
  addWatcher(@Param('taskId') taskId: string, @Body() body: { userId: string }) {
    return this.collaborationService.addWatcher(taskId, body.userId);
  }

  @Get('watchers/:taskId')
  getWatchers(@Param('taskId') taskId: string) {
    return this.collaborationService.getWatchers(taskId);
  }

  @Delete('watchers/:taskId/:userId')
  removeWatcher(@Param('taskId') taskId: string, @Param('userId') userId: string) {
    return this.collaborationService.removeWatcher(taskId, userId);
  }
}

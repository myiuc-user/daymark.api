import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Patch } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.tasksService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  create(@Body() data: any, @CurrentUser() user: any) {
    return this.tasksService.create(data, user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.tasksService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }

  @Get(':id/subtasks')
  getSubtasks(@Param('id') taskId: string) {
    return [];
  }

  @Post(':id/subtasks')
  createSubtask(@Param('id') taskId: string, @Body() data: any) {
    return { subtask: data };
  }

  @Patch(':taskId/subtasks/toggle-status')
  toggleSubtaskStatus(@Param('taskId') taskId: string) {
    return { success: true };
  }

  @Get(':id/comments')
  getComments(@Param('id') taskId: string) {
    return [];
  }

  @Post(':id/comments')
  createComment(@Param('id') taskId: string, @Body() data: any, @CurrentUser() user: any) {
    return { comment: { ...data, userId: user.id } };
  }
}

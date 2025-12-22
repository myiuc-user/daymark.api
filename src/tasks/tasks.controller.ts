import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Patch } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Controller('tasks')
@UseGuards(JwtGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(@Query('projectId') projectId: string, @Query('workspaceId') workspaceId: string) {
    if (workspaceId) {
      return this.tasksService.findAllByWorkspace(workspaceId);
    }
    return this.tasksService.findAll(projectId);
  }

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Get(':id/subtasks')
  getSubtasks(@Param('id') taskId: string) {
    return this.tasksService.getSubtasks(taskId);
  }

  @Post(':id/subtasks')
  createSubtask(@Param('id') taskId: string, @Body() data: any, @CurrentUser() user: any) {
    return this.tasksService.createSubtask(taskId, data, user.id);
  }

  @Get(':id/comments')
  getComments(@Param('id') taskId: string) {
    return this.tasksService.getComments(taskId);
  }

  @Post(':id/comments')
  createComment(@Param('id') taskId: string, @Body() data: any, @CurrentUser() user: any) {
    return this.tasksService.createComment(taskId, data, user.id);
  }

  @Patch(':taskId/subtasks/toggle-status')
  toggleSubtaskStatus(@Param('taskId') taskId: string) {
    return { success: true };
  }

  @Patch(':id/archive')
  toggleArchive(@Param('id') taskId: string) {
    return this.tasksService.toggleArchive(taskId);
  }

  @Patch(':id/favorite')
  toggleFavorite(@Param('id') taskId: string) {
    return this.tasksService.toggleFavorite(taskId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') taskId: string, @Body() data: any) {
    return this.tasksService.update(taskId, { status: data.status });
  }

  @Get(':id/history')
  getHistory(@Param('id') taskId: string) {
    return this.tasksService.getHistory(taskId);
  }

  @Get(':id/activity')
  getActivity(@Param('id') taskId: string) {
    return [];
  }

  @Get(':id/time')
  getTimeEntries(@Param('id') taskId: string) {
    return this.tasksService.getTimeEntries(taskId);
  }

  @Post(':id/time')
  addTimeEntry(@Param('id') taskId: string, @Body() data: any, @CurrentUser() user: any) {
    return this.tasksService.addTimeEntry(taskId, data, user.id);
  }

  @Get(':id/watchers')
  getWatchers(@Param('id') taskId: string) {
    return this.tasksService.getWatchers(taskId);
  }

  @Post(':id/watchers')
  addWatcher(@Param('id') taskId: string, @Body() data: any) {
    return this.tasksService.addWatcher(taskId, data.userId);
  }

  @Delete(':id/watchers/:userId')
  removeWatcher(@Param('id') taskId: string, @Param('userId') userId: string) {
    return this.tasksService.removeWatcher(taskId, userId);
  }

  @Get(':id/dependencies')
  getDependencies(@Param('id') taskId: string) {
    return [];
  }

  @Post(':id/dependencies')
  addDependency(@Param('id') taskId: string, @Body() data: any) {
    return { success: true };
  }

  @Delete(':id/dependencies/:dependsOnId')
  removeDependency(@Param('id') taskId: string, @Param('dependsOnId') dependsOnId: string) {
    return { success: true };
  }

  @Get(':id/blocking')
  getBlockingTasks(@Param('id') taskId: string) {
    return [];
  }

  @Get('recurring')
  getRecurringTasks(@Query('projectId') projectId: string) {
    return [];
  }

  @Post('recurring')
  createRecurringTask(@Body() data: any) {
    return { recurringTask: data };
  }

  @Put('recurring/:id')
  updateRecurringTask(@Param('id') id: string, @Body() data: any) {
    return { recurringTask: data };
  }

  @Delete('recurring/:id')
  deleteRecurringTask(@Param('id') id: string) {
    return { success: true };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }
}

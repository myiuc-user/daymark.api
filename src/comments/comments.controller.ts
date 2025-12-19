import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('comments')
@UseGuards(JwtGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get(':taskId')
  findAll(@Param('taskId') taskId: string) {
    return this.commentsService.findAll(taskId);
  }

  @Post()
  create(@Body() data: any) {
    return this.commentsService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.commentsService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.commentsService.delete(id);
  }
}

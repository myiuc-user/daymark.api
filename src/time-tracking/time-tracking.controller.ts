import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('time-entries')
@UseGuards(JwtGuard)
export class TimeTrackingController {
  constructor(private timeTrackingService: TimeTrackingService) {}

  @Get()
  findAll(@Param('taskId') taskId: string) {
    return this.timeTrackingService.findAll(taskId);
  }

  @Post()
  create(@Body() data: any) {
    return this.timeTrackingService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.timeTrackingService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.timeTrackingService.delete(id);
  }

  @Get(':taskId/summary')
  getSummary(@Param('taskId') taskId: string) {
    return this.timeTrackingService.getSummary(taskId);
  }
}

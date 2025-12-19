import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('milestones')
@UseGuards(JwtGuard)
export class MilestonesController {
  constructor(private milestonesService: MilestonesService) {}

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.milestonesService.findAll(projectId);
  }

  @Post()
  create(@Body() data: any) {
    return this.milestonesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.milestonesService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.milestonesService.delete(id);
  }
}

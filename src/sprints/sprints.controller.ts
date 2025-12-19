import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('sprints')
@UseGuards(JwtGuard)
export class SprintsController {
  constructor(private sprintsService: SprintsService) {}

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.sprintsService.findAll(projectId);
  }

  @Post()
  create(@Body() data: any) {
    return this.sprintsService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.sprintsService.update(id, data);
  }

  @Put(':id/activate')
  activate(@Param('id') id: string) {
    return this.sprintsService.activate(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.sprintsService.delete(id);
  }
}

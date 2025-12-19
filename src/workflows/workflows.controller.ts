import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('workflows')
@UseGuards(JwtGuard)
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Get()
  findAll(@Query('projectId') projectId: string) {
    return this.workflowsService.findAll(projectId);
  }

  @Post()
  create(@Body() data: any) {
    return this.workflowsService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.workflowsService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.workflowsService.delete(id);
  }

  @Post('init-project/:projectId')
  initProjectWorkflow(@Param('projectId') projectId: string) {
    return this.workflowsService.initProjectWorkflow(projectId);
  }
}

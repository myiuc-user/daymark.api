import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('reports')
@UseGuards(JwtGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  async getScheduledReports(@Request() req: any) {
    return this.reportsService.getScheduledReports(req.user.id);
  }

  @Post()
  async createScheduledReport(@Request() req: any, @Body() data: any) {
    return this.reportsService.createScheduledReport({
      ...data,
      createdById: req.user.id
    });
  }

  @Put(':id')
  async updateScheduledReport(@Param('id') id: string, @Body() data: any) {
    return this.reportsService.updateScheduledReport(id, data);
  }

  @Delete(':id')
  async deleteScheduledReport(@Param('id') id: string) {
    return this.reportsService.deleteScheduledReport(id);
  }

  @Post(':id/execute')
  async executeReport(@Param('id') id: string) {
    return this.reportsService.executeReportManually(id);
  }

  @Get(':id/executions')
  async getReportExecutions(@Param('id') id: string) {
    return this.reportsService.getReportExecutions(id);
  }
}
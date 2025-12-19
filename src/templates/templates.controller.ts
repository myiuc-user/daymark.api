import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('templates')
@UseGuards(JwtGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.templatesService.create(data);
  }

  @Post(':id/use')
  use(@Param('id') id: string, @Body() projectData: any) {
    return this.templatesService.use(id, projectData);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('audit')
@UseGuards(JwtGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.auditService.findAll(user.id);
  }

  @Get('project/:projectId')
  getProjectAudit(@Param('projectId') projectId: string) {
    return this.auditService.getProjectAudit(projectId);
  }
}

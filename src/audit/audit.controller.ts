import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('audit')
@UseGuards(JwtGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  getLogs(@CurrentUser() user: any, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.auditService.getLogs(parseInt(limit || '50'), parseInt(offset || '0'), user.id);
  }

  @Get('project/:projectId')
  getProjectAudit(@Param('projectId') projectId: string) {
    return this.auditService.getProjectAudit(projectId);
  }
}

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('delegations')
@UseGuards(JwtGuard)
export class DelegationsController {
  constructor(private delegationsService: DelegationsService) {}

  @Post()
  delegateTask(@Body() body: { taskId: string; toUserId: string }, @CurrentUser() user: any) {
    return this.delegationsService.delegateTask(body.taskId, user.id, body.toUserId);
  }

  @Get()
  getDelegations(@CurrentUser() user: any) {
    return this.delegationsService.getDelegations(user.id);
  }
}

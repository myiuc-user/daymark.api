import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('teams')
@UseGuards(JwtGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post('invite')
  inviteMember(@Body() data: any) {
    return this.teamsService.inviteMember(data);
  }

  @Post('accept-invitation')
  acceptInvitation(@Body() body: { invitationId: string }) {
    return this.teamsService.acceptInvitation(body.invitationId);
  }

  @Post('project-role')
  assignProjectRole(@Body() data: any) {
    return this.teamsService.assignProjectRole(data);
  }

  @Post('assign-multiple')
  assignMultiple(@Body() data: any) {
    return this.teamsService.assignMultiple(data);
  }
}

import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.usersService.update(id, updateData);
  }

  @Get('permissions/project/:projectId')
  getProjectPermissions(@Param('projectId') projectId: string, @CurrentUser() user: any) {
    return this.usersService.getProjectPermissions(user.id, projectId);
  }

  @Get('permissions/workspace/:workspaceId')
  getWorkspacePermissions(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.usersService.getWorkspacePermissions(user.id, workspaceId);
  }
}

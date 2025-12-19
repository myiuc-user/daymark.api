import { Controller, Post, Get, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password required');
    }

    try {
      const user = await this.authService.authenticateUser(body.email, body.password);
      const { accessToken } = this.authService.generateTokens(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        accessToken
      };
    } catch (error) {
      throw new BadRequestException('Invalid credentials');
    }
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@CurrentUser() user: any) {
    const currentUser = await this.authService.getCurrentUser(user.id);
    return { user: currentUser };
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully' };
  }
}

import { Controller, Post, Get, Body, UseGuards, BadRequestException, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SkipTwoFactor } from '../two-factor/skip-two-factor.decorator';
import { SendEmailCodeDto, VerifyTwoFactorDto } from '../two-factor/dto/two-factor.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private twoFactorService: TwoFactorService
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password required');
    }

    try {
      const user = await this.authService.authenticateUser(body.email, body.password);
      
      // Check if 2FA is enabled
      if (user.twoFactorEnabled && user.twoFactorMethods.length > 0) {
        // Generate temporary token for 2FA step
        const tempToken = this.authService.generateTokens(user.id, false);
        
        return {
          requiresTwoFactor: true,
          availableMethods: user.twoFactorMethods,
          tempToken: tempToken.accessToken,
          userId: user.id
        };
      }

      // No 2FA required, proceed with normal login
      const { accessToken } = this.authService.generateTokens(user.id, true);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorMethods: user.twoFactorMethods || []
        },
        accessToken
      };
    } catch (error) {
      throw new BadRequestException('Invalid credentials');
    }
  }

  @Post('login/2fa/send-code')
  @SkipTwoFactor()
  @UsePipes(new ValidationPipe())
  async sendTwoFactorCode(@Body() sendCodeDto: SendEmailCodeDto) {
    if (sendCodeDto.method === 'EMAIL') {
      return this.twoFactorService.sendEmailCode(sendCodeDto.userId);
    }

    throw new BadRequestException('Invalid 2FA method');
  }

  @Post('login/2fa/verify')
  @SkipTwoFactor()
  @UsePipes(new ValidationPipe())
  async verifyTwoFactor(@Body() verifyDto: VerifyTwoFactorDto) {
    try {
      let isValid = false;
      
      if (verifyDto.isBackupCode) {
        isValid = await this.twoFactorService.verifyBackupCode(verifyDto.userId, verifyDto.code);
      } else {
        isValid = await this.twoFactorService.verifyCode(verifyDto.userId, verifyDto.code, verifyDto.method);
      }

      if (!isValid) {
        throw new BadRequestException('Invalid 2FA code');
      }

      const user = await this.authService.getCurrentUser(verifyDto.userId);
      const { accessToken } = this.authService.generateTokens(verifyDto.userId, true);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorMethods: user.twoFactorMethods || []
        },
        accessToken
      };
    } catch (error) {
      throw new BadRequestException('2FA verification failed');
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

import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  UseGuards, 
  Request,
  BadRequestException,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkipTwoFactor } from './skip-two-factor.decorator';
import { 
  SetupTOTPDto, 
  VerifyCodeDto, 
  VerifyBackupCodeDto 
} from './dto/two-factor.dto';

@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
@SkipTwoFactor()
export class TwoFactorController {
  constructor(private twoFactorService: TwoFactorService) {}

  @Get('status')
  async getStatus(@Request() req) {
    return this.twoFactorService.getUserTwoFactorStatus(req.user.id);
  }

  @Post('totp/setup')
  async setupTOTP(@Request() req) {
    return this.twoFactorService.generateTOTPSecret(req.user.id);
  }

  @Post('totp/verify-setup')
  @UsePipes(new ValidationPipe())
  async verifyTOTPSetup(
    @Request() req,
    @Body() setupDto: SetupTOTPDto
  ) {
    return this.twoFactorService.verifyTOTPSetup(req.user.id, setupDto.token, setupDto.secret);
  }

  @Post('email/setup')
  async setupEmail(@Request() req) {
    return this.twoFactorService.setupEmailTwoFactor(req.user.id);
  }

  @Post('email/send-code')
  async sendEmailCode(@Request() req) {
    return this.twoFactorService.sendEmailCode(req.user.id);
  }

  @Post('verify')
  @UsePipes(new ValidationPipe())
  async verifyCode(
    @Request() req,
    @Body() verifyDto: VerifyCodeDto
  ) {
    const isValid = await this.twoFactorService.verifyCode(req.user.id, verifyDto.code, verifyDto.method);
    return { valid: isValid };
  }

  @Post('backup-code/verify')
  @UsePipes(new ValidationPipe())
  async verifyBackupCode(
    @Request() req,
    @Body() backupDto: VerifyBackupCodeDto
  ) {
    const isValid = await this.twoFactorService.verifyBackupCode(req.user.id, backupDto.code);
    return { valid: isValid };
  }

  @Post('backup-codes/regenerate')
  async regenerateBackupCodes(@Request() req) {
    return this.twoFactorService.regenerateBackupCodes(req.user.id);
  }

  @Delete('disable')
  async disable2FA(@Request() req) {
    return this.twoFactorService.disable2FA(req.user.id);
  }
}
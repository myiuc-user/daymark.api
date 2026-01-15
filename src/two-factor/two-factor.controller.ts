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
import { JwtGuard } from '../common/guards/jwt.guard';
import { SkipTwoFactor } from './skip-two-factor.decorator';
import { Public } from '../common/decorators/public.decorator';
import { 
  SetupTOTPDto, 
  VerifyCodeDto, 
  VerifyBackupCodeDto 
} from './dto/two-factor.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('auth/2fa')
@UseGuards(JwtGuard)
@SkipTwoFactor()
export class TwoFactorController {
  constructor(private twoFactorService: TwoFactorService) {}

  @Get('status')
  async getStatus(@Request() req: AuthenticatedRequest) {
    return this.twoFactorService.getUserTwoFactorStatus(req.user.id);
  }

  @Post('totp/setup')
  async setupTOTP(@Request() req: AuthenticatedRequest) {
    return this.twoFactorService.generateTOTPSecret(req.user.id);
  }

  @Post('totp/verify-setup')
  @UsePipes(new ValidationPipe())
  async verifyTOTPSetup(
    @Request() req: AuthenticatedRequest,
    @Body() setupDto: SetupTOTPDto
  ) {
    return this.twoFactorService.verifyTOTPSetup(req.user.id, setupDto.token, setupDto.secret);
  }

  @Post('email/setup')
  async setupEmail(@Request() req: AuthenticatedRequest) {
    return this.twoFactorService.setupEmailTwoFactor(req.user.id);
  }

  @Post('email/send-code')
  async sendEmailCode(@Request() req: AuthenticatedRequest) {
    return this.twoFactorService.sendEmailCode(req.user.id);
  }

  @Post('verify')
  @UsePipes(new ValidationPipe())
  async verifyCode(
    @Request() req: AuthenticatedRequest,
    @Body() verifyDto: VerifyCodeDto
  ) {
    const isValid = await this.twoFactorService.verifyCode(req.user.id, verifyDto.code, verifyDto.method);
    return { valid: isValid };
  }

  @Post('backup-code/verify')
  @UsePipes(new ValidationPipe())
  async verifyBackupCode(
    @Request() req: AuthenticatedRequest,
    @Body() backupDto: VerifyBackupCodeDto
  ) {
    const isValid = await this.twoFactorService.verifyBackupCode(req.user.id, backupDto.code);
    return { valid: isValid };
  }

  @Post('backup-codes/regenerate')
  async regenerateBackupCodes(@Request() req: AuthenticatedRequest) {
    return this.twoFactorService.regenerateBackupCodes(req.user.id);
  }

  @Delete('disable')
  async disable2FA(@Request() req: AuthenticatedRequest) {
    return this.twoFactorService.disable2FA(req.user.id);
  }

  @Post('recovery/request')
  @Public()
  async requestRecovery(@Body() body: { email: string }) {
    return this.twoFactorService.requestRecovery(body.email);
  }

  @Post('recovery/verify')
  @Public()
  async verifyRecovery(@Body() body: { token: string }) {
    return this.twoFactorService.verifyRecoveryToken(body.token);
  }
}
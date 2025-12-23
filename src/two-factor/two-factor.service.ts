import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as bcryptjs from 'bcryptjs';
import * as crypto from 'crypto';
import { TwoFactorMethod } from '@prisma/client';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async generateTOTPSecret(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `Daymark (${user.email})`,
      issuer: 'Daymark Project Management',
      length: 32
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  async verifyTOTPSetup(userId: string, token: string, secret: string) {
    const verified = speakeasy.totp.verify({
      secret,
      token,
      window: 2,
      encoding: 'base32'
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcryptjs.hash(code, 10))
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorMethods: ['TOTP'],
        twoFactorSecret: secret,
        backupCodes: hashedBackupCodes,
        twoFactorVerifiedAt: new Date()
      }
    });

    return { backupCodes };
  }

  async setupEmailTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const currentMethods = user.twoFactorMethods || [];
    if (!currentMethods.includes('EMAIL')) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorMethods: [...currentMethods, 'EMAIL'],
          twoFactorVerifiedAt: new Date()
        }
      });
    }

    return { success: true };
  }

  async sendEmailCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorMethods.includes('EMAIL')) {
      throw new BadRequestException('Email 2FA not enabled');
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const hashedCode = await bcryptjs.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.twoFactorCode.create({
      data: {
        userId,
        code: hashedCode,
        method: 'EMAIL',
        expiresAt
      }
    });

    // Send email with code
    await this.emailService.send2FACode(user.email, code);

    return { success: true };
  }

  async verifyCode(userId: string, code: string, method: TwoFactorMethod) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorEnabled) {
      throw new UnauthorizedException('2FA not enabled');
    }

    if (method === 'TOTP') {
      return this.verifyTOTP(user.twoFactorSecret, code);
    } else if (method === 'EMAIL') {
      return this.verifyEmailCode(userId, code);
    }

    throw new BadRequestException('Invalid 2FA method');
  }

  private verifyTOTP(secret: string | null, token: string): boolean {
    if (!secret) return false;

    return speakeasy.totp.verify({
      secret,
      token,
      window: 2,
      encoding: 'base32'
    });
  }

  private async verifyEmailCode(userId: string, code: string): Promise<boolean> {
    const storedCode = await this.prisma.twoFactorCode.findFirst({
      where: {
        userId,
        method: 'EMAIL',
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!storedCode) return false;

    const isValid = await bcryptjs.compare(code, storedCode.code);

    if (isValid) {
      await this.prisma.twoFactorCode.update({
        where: { id: storedCode.id },
        data: { used: true }
      });
    }

    return isValid;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.backupCodes.length) return false;

    for (let i = 0; i < user.backupCodes.length; i++) {
      const isValid = await bcryptjs.compare(code, user.backupCodes[i]);
      if (isValid) {
        const updatedCodes = user.backupCodes.filter((_, index) => index !== i);
        await this.prisma.user.update({
          where: { id: userId },
          data: { backupCodes: updatedCodes }
        });
        return true;
      }
    }

    return false;
  }

  async regenerateBackupCodes(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA not enabled');
    }

    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcryptjs.hash(code, 10))
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { backupCodes: hashedBackupCodes }
    });

    return { backupCodes };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorMethods: [],
        twoFactorSecret: null,
        backupCodes: [],
        twoFactorVerifiedAt: null
      }
    });

    await this.prisma.twoFactorCode.deleteMany({
      where: { userId, used: false }
    });

    return { success: true };
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 8 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
  }

  async getUserTwoFactorStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorMethods: true,
        backupCodes: true
      }
    });

    return {
      enabled: user?.twoFactorEnabled || false,
      methods: user?.twoFactorMethods || [],
      backupCodesCount: user?.backupCodes?.length || 0
    };
  }
}
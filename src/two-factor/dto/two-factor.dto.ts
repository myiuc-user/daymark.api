import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { TwoFactorMethod } from '@prisma/client';

export class SetupTOTPDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  secret: string;
}

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(TwoFactorMethod)
  method: TwoFactorMethod;
}

export class SendEmailCodeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(TwoFactorMethod)
  method: TwoFactorMethod;
}

export class VerifyTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(TwoFactorMethod)
  method: TwoFactorMethod;

  @IsOptional()
  @IsBoolean()
  isBackupCode?: boolean;
}

export class VerifyBackupCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
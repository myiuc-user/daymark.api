import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as 2FA exempt
    const skipTwoFactor = this.reflector.get<boolean>('skipTwoFactor', context.getHandler());
    if (skipTwoFactor) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      
      // If user has 2FA enabled but hasn't verified in this session
      if (payload.twoFactorVerified === false) {
        throw new UnauthorizedException('2FA verification required');
      }

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or 2FA required');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
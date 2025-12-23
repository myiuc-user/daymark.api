import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TwoFactorService } from '../two-factor/two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private twoFactorService: TwoFactorService
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateTokens(userId: string, twoFactorVerified = false) {
    const payload = { userId, twoFactorVerified };
    
    const accessToken = this.jwtService.sign(
      payload,
      { expiresIn: '24h' }
    );

    const refreshToken = this.jwtService.sign(
      payload,
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async authenticateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        twoFactorMethods: true
      }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
        twoFactorEnabled: true,
        twoFactorMethods: true
      }
    });

    return {
      ...user,
      twoFactorMethods: user?.twoFactorMethods || []
    };
  }

  async createRootAdmin() {
    try {
      const existingAdmin = await this.prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      });

      if (existingAdmin) {
        console.log('Root admin already exists');
        return;
      }

      const adminPassword = process.env.ROOT_ADMIN_PASSWORD;
      const adminEmail = process.env.ROOT_ADMIN_EMAIL;
      
      if (!adminPassword || !adminEmail) {
        throw new Error('ROOT_ADMIN_PASSWORD and ROOT_ADMIN_EMAIL must be set');
      }

      const hashedPassword = await this.hashPassword(adminPassword);
      
      await this.prisma.user.create({
        data: {
          name: 'Super Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });

      console.log(`Root admin created: ${adminEmail}`);
    } catch (error) {
      console.error('Error creating root admin:', error instanceof Error ? error.message : String(error));
    }
  }

  async resetAdminPassword() {
    try {
      const adminPassword = process.env.ROOT_ADMIN_PASSWORD;
      const adminEmail = process.env.ROOT_ADMIN_EMAIL;
      
      if (!adminPassword || !adminEmail) {
        throw new Error('ROOT_ADMIN_PASSWORD and ROOT_ADMIN_EMAIL must be set');
      }

      const hashedPassword = await this.hashPassword(adminPassword);
      
      const updated = await this.prisma.user.updateMany({
        where: { email: adminEmail },
        data: { password: hashedPassword }
      });

      if (updated.count > 0) {
        console.log(`Admin password reset for: ${adminEmail}`);
      }
    } catch (error) {
      console.error('Error resetting admin password:', error instanceof Error ? error.message : String(error));
    }
  }
}

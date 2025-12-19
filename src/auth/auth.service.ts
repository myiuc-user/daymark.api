import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { userId },
      { expiresIn: '24h' }
    );

    const refreshToken = this.jwtService.sign(
      { userId },
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
        isActive: true
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
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true
      }
    });
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

      const hashedPassword = await this.hashPassword(process.env.ROOT_ADMIN_PASSWORD);
      
      await this.prisma.user.create({
        data: {
          name: 'Super Admin',
          email: process.env.ROOT_ADMIN_EMAIL,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });

      console.log(`Root admin created: ${process.env.ROOT_ADMIN_EMAIL}`);
    } catch (error) {
      console.error('Error creating root admin:', error.message);
    }
  }

  async resetAdminPassword() {
    try {
      const hashedPassword = await this.hashPassword(process.env.ROOT_ADMIN_PASSWORD);
      
      const updated = await this.prisma.user.updateMany({
        where: { email: process.env.ROOT_ADMIN_EMAIL },
        data: { password: hashedPassword }
      });

      if (updated.count > 0) {
        console.log(`Admin password reset for: ${process.env.ROOT_ADMIN_EMAIL}`);
      }
    } catch (error) {
      console.error('Error resetting admin password:', error.message);
    }
  }
}

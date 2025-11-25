import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 12);
  } catch (error) {
    console.error('Error hashing password:', error.message);
    throw error;
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error comparing password:', error.message);
    throw error;
  }
};

export const generateTokens = (userId) => {
  try {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error.message);
    throw error;
  }
};

export const createRootAdmin = async () => {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (existingAdmin) {
      console.log('Root admin already exists');
      return;
    }

    const hashedPassword = await hashPassword(process.env.ROOT_ADMIN_PASSWORD);
    
    const rootAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: process.env.ROOT_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    console.log(`Root admin created: ${rootAdmin.email}`);
  } catch (error) {
    console.error('Error creating root admin:', error);
  }
};
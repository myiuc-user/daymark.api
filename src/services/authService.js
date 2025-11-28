import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

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
      { expiresIn: '24h' }
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

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const authenticateUser = async (email, password) => {
  const user = await prisma.user.findUnique({
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

  if (!user) {
    console.log(`User not found: ${email}`);
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    console.log(`User inactive: ${email}`);
    throw new Error('Invalid credentials');
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    console.log(`Invalid password for user: ${email}`);
    throw new Error('Invalid credentials');
  }

  return user;
};

export const getCurrentUser = async (userId) => {
  return await prisma.user.findUnique({
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
};

export const createRootAdmin = async () => {
  try {
    let existingAdmin;
    try {
      existingAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      });
    } catch (error) {
      if (error.code === 'P2022') {
        console.log('Database schema not fully migrated, skipping root admin check');
        return;
      }
      throw error;
    }

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
    console.error('Error creating root admin:', error.message);
  }
};

export const resetAdminPassword = async () => {
  try {
    const hashedPassword = await hashPassword(process.env.ROOT_ADMIN_PASSWORD);
    
    const updated = await prisma.user.updateMany({
      where: { email: process.env.ROOT_ADMIN_EMAIL },
      data: { password: hashedPassword }
    });

    if (updated.count > 0) {
      console.log(`Admin password reset for: ${process.env.ROOT_ADMIN_EMAIL}`);
    } else {
      console.log(`Admin user not found: ${process.env.ROOT_ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error('Error resetting admin password:', error.message);
  }
};

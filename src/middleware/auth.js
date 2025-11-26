import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log(`[Auth] No token provided for ${req.method} ${req.path}`);
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      console.log(`[Auth] Invalid or inactive user for ${req.method} ${req.path}`);
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    console.log(`[Auth] User authenticated: ${user.id} for ${req.method} ${req.path}`);
    req.user = user;
    next();
  } catch (error) {
    console.log(`[Auth] Token verification failed for ${req.method} ${req.path}:`, error.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);

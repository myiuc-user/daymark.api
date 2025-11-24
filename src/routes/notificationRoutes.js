import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';

const router = express.Router();

router.use(authenticateToken);

// SSE endpoint for real-time notifications
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  notificationService.addClient(req.user.id, res);
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
});

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const skip = (page - 1) * limit;
    
    const where = { userId: req.user.id };
    if (unread === 'true') where.read = false;
    
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, read: false } })
    ]);

    res.json({ 
      notifications, 
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification preferences
router.get('/preferences', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true }
    });
    
    // Default preferences (could be stored in DB)
    const preferences = {
      email: true,
      push: true,
      taskAssigned: true,
      taskDue: true,
      projectUpdates: true,
      mentions: true
    };
    
    res.json({ preferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.put('/preferences', async (req, res) => {
  try {
    // In a real app, store preferences in database
    res.json({ success: true, preferences: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await prisma.notification.update({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.user.id,
        read: false 
      },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await prisma.notification.delete({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    await notificationService.createNotification({
      userId: req.user.id,
      type: 'TEST',
      title: 'Test Notification',
      message: 'This is a test notification',
      data: { timestamp: new Date().toISOString() }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
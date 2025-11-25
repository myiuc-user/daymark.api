import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// GET /api/time-entries?taskId=:id&userId=:id
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { taskId, userId, projectId } = req.query;
    const where = {};
    
    if (taskId) where.taskId = taskId;
    if (userId) where.userId = userId;
    if (projectId) {
      where.task = { projectId };
    }
    
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: { user: true, task: true },
      orderBy: { date: 'desc' }
    });
    
    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/time-entries
router.post('/', authenticateToken, async (req, res) => {
  try {
    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...req.body,
        userId: req.user.id
      },
      include: { user: true, task: true }
    });
    res.status(201).json(timeEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/time-entries/summary?projectId=:id
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;
    
    const summary = await prisma.timeEntry.groupBy({
      by: ['userId'],
      where: {
        task: { projectId }
      },
      _sum: { hours: true },
      _count: true
    });
    
    const users = await prisma.user.findMany({
      where: { id: { in: summary.map(s => s.userId) } }
    });
    
    const result = summary.map(s => ({
      user: users.find(u => u.id === s.userId),
      totalHours: s._sum.hours,
      entriesCount: s._count
    }));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
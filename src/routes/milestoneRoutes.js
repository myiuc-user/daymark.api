import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// GET /api/milestones?projectId=:id
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;
    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      include: { tasks: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json(milestones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/milestones
router.post('/', authenticateToken, async (req, res) => {
  try {
    const milestone = await prisma.milestone.create({
      data: req.body,
      include: { tasks: true }
    });
    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/milestones/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const milestone = await prisma.milestone.update({
      where: { id: req.params.id },
      data: req.body,
      include: { tasks: true }
    });
    res.json(milestone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/milestones/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.milestone.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// GET /api/sprints?projectId=:id
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;
    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: { tasks: true },
      orderBy: { startDate: 'desc' }
    });
    res.json(sprints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sprints
router.post('/', authenticateToken, async (req, res) => {
  try {
    const sprint = await prisma.sprint.create({
      data: req.body,
      include: { tasks: true }
    });
    res.status(201).json(sprint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/sprints/:id/activate
router.put('/:id/activate', authenticateToken, async (req, res) => {
  try {
    // Désactiver les autres sprints du projet
    const sprint = await prisma.sprint.findUnique({
      where: { id: req.params.id }
    });
    
    await prisma.sprint.updateMany({
      where: { projectId: sprint.projectId },
      data: { active: false }
    });
    
    // Activer le sprint sélectionné
    const activatedSprint = await prisma.sprint.update({
      where: { id: req.params.id },
      data: { active: true },
      include: { tasks: true }
    });
    
    res.json(activatedSprint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// GET /api/templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = await prisma.projectTemplate.findMany({
      where: {
        OR: [
          { isPublic: true },
          { createdById: req.user.id }
        ]
      },
      include: { createdBy: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/templates
router.post('/', authenticateToken, async (req, res) => {
  try {
    const template = await prisma.projectTemplate.create({
      data: {
        ...req.body,
        createdById: req.user.id
      },
      include: { createdBy: true }
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/templates/:id/use
router.post('/:id/use', authenticateToken, async (req, res) => {
  try {
    const template = await prisma.projectTemplate.findUnique({
      where: { id: req.params.id }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const { workspaceId, name } = req.body;
    
    // Créer le projet à partir du template
    const project = await prisma.project.create({
      data: {
        name,
        description: template.data.description,
        workspaceId,
        team_lead: req.user.id,
        priority: template.data.priority || 'MEDIUM',
        status: 'PLANNING'
      }
    });
    
    // Créer les tâches du template
    if (template.data.tasks) {
      for (const taskData of template.data.tasks) {
        await prisma.task.create({
          data: {
            ...taskData,
            projectId: project.id,
            assigneeId: req.user.id
          }
        });
      }
    }
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
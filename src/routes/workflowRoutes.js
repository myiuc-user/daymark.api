import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../app.js';

const router = express.Router();

// GET /api/workflows?projectId=:id
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;
    const states = await prisma.workflowState.findMany({
      where: { projectId },
      include: { tasks: true },
      orderBy: { order: 'asc' }
    });
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workflows
router.post('/', authenticateToken, async (req, res) => {
  try {
    const state = await prisma.workflowState.create({
      data: req.body
    });
    res.status(201).json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/workflows/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const state = await prisma.workflowState.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workflows/init-project/:projectId
router.post('/init-project/:projectId', authenticateToken, async (req, res) => {
  try {
    const defaultStates = [
      { name: 'À faire', color: '#gray', order: 1, isDefault: true },
      { name: 'En cours', color: '#blue', order: 2, isDefault: false },
      { name: 'En révision', color: '#yellow', order: 3, isDefault: false },
      { name: 'Terminé', color: '#green', order: 4, isDefault: false }
    ];
    
    const states = await Promise.all(
      defaultStates.map(state => 
        prisma.workflowState.create({
          data: {
            ...state,
            projectId: req.params.projectId
          }
        })
      )
    );
    
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
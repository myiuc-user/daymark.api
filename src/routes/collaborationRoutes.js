import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { prisma } from '../app.js';

const router = express.Router();

// POST /api/collaboration/mentions
router.post('/mentions', authenticateToken, async (req, res) => {
  try {
    const { commentId, userIds } = req.body;
    
    const mentions = await Promise.all(
      userIds.map(userId => 
        prisma.mention.create({
          data: { userId, commentId },
          include: { user: true }
        })
      )
    );
    
    // Créer des notifications pour les mentions
    await Promise.all(
      userIds.map(userId => 
        prisma.notification.create({
          data: {
            userId,
            type: 'MENTION',
            title: 'Vous avez été mentionné',
            message: `${req.user.name} vous a mentionné dans un commentaire`
          }
        })
      )
    );
    
    res.status(201).json(mentions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/collaboration/watchers/:taskId
router.post('/watchers/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    
    const watcher = await prisma.taskWatcher.create({
      data: { taskId, userId },
      include: { user: true }
    });
    
    res.status(201).json(watcher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/collaboration/watchers/:taskId/:userId
router.delete('/watchers/:taskId/:userId', authenticateToken, async (req, res) => {
  try {
    await prisma.taskWatcher.delete({
      where: {
        userId_taskId: {
          userId: req.params.userId,
          taskId: req.params.taskId
        }
      }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/collaboration/watchers/:taskId
router.get('/watchers/:taskId', authenticateToken, async (req, res) => {
  try {
    const watchers = await prisma.taskWatcher.findMany({
      where: { taskId: req.params.taskId },
      include: { user: true }
    });
    res.json(watchers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
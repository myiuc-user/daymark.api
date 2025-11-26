import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${q}%`;
    const workspaceId = req.query.workspaceId;

    const [projects, tasks, users] = await Promise.all([
      prisma.project.findMany({
        where: {
          AND: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            workspaceId ? { workspaceId } : {}
          ]
        },
        select: { id: true, name: true },
        take: 5
      }),
      prisma.task.findMany({
        where: {
          AND: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            workspaceId ? { project: { workspaceId } } : {}
          ]
        },
        select: { id: true, title: true },
        take: 5
      }),
      prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          ]
        },
        select: { id: true, name: true, email: true },
        take: 5
      })
    ]);

    const results = [
      ...projects.map(p => ({ id: p.id, name: p.name, type: 'project' })),
      ...tasks.map(t => ({ id: t.id, name: t.title, type: 'task' })),
      ...users.map(u => ({ id: u.id, name: u.name || u.email, type: 'user' }))
    ];

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;

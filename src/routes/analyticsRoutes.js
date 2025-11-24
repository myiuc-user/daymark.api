import express from 'express';
import { prisma } from '../app.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Analytics dashboard
router.get('/dashboard/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const [projects, tasks, members] = await Promise.all([
      prisma.project.findMany({
        where: { workspaceId },
        include: { tasks: true }
      }),
      prisma.task.findMany({
        where: { project: { workspaceId } }
      }),
      prisma.workspaceMember.count({
        where: { workspaceId }
      })
    ]);

    const analytics = {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      totalMembers: members,
      completedTasks: tasks.filter(t => t.status === 'DONE').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todoTasks: tasks.filter(t => t.status === 'TODO').length,
      completionRate: tasks.length ? (tasks.filter(t => t.status === 'DONE').length / tasks.length * 100).toFixed(1) : 0,
      projectsProgress: projects.map(p => ({
        id: p.id,
        name: p.name,
        progress: p.progress,
        tasksCount: p.tasks.length,
        completedTasks: p.tasks.filter(t => t.status === 'DONE').length
      }))
    };

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// COCOMO estimation
router.post('/estimate', authenticateToken, async (req, res) => {
  try {
    const { linesOfCode, complexity = 'ORGANIC' } = req.body;
    
    const coefficients = {
      ORGANIC: { a: 2.4, b: 1.05, c: 2.5, d: 0.38 },
      SEMI_DETACHED: { a: 3.0, b: 1.12, c: 2.5, d: 0.35 },
      EMBEDDED: { a: 3.6, b: 1.20, c: 2.5, d: 0.32 }
    };
    
    const { a, b, c, d } = coefficients[complexity];
    const kloc = linesOfCode / 1000;
    
    const effort = a * Math.pow(kloc, b); // Person-months
    const time = c * Math.pow(effort, d); // Months
    const people = effort / time; // Average team size
    
    res.json({
      linesOfCode,
      complexity,
      effort: Math.round(effort * 10) / 10,
      developmentTime: Math.round(time * 10) / 10,
      averageTeamSize: Math.round(people * 10) / 10,
      estimatedCost: Math.round(effort * 8000) // Assuming $8000/person-month
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, createTaskSchema } from '../utils/validation.js';

const router = express.Router();

// All task routes require authentication
router.use(authenticateToken);

// Get tasks (by project)
router.get('/', async (req, res) => {
  try {
    const { projectId, status, priority, assigneeId, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Check project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId: req.user.id }
            }
          }
        },
        members: {
          where: { userId: req.user.id }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const hasAccess = project.workspace.ownerId === req.user.id ||
      project.workspace.members.length > 0 ||
      project.team_lead === req.user.id ||
      project.members.length > 0;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build where clause with filters
    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true }
        },
        project: {
          select: { id: true, name: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        files: {
          select: { id: true, name: true, size: true, mimetype: true }
        }
      },
      orderBy: { [sortBy]: sortOrder }
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', validateRequest(createTaskSchema), async (req, res) => {
  try {
    const { title, description, status, type, priority, assigneeId, projectId, due_date } = req.body;

    // Check project access and if assignee exists
    const [project, assignee] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          workspace: {
            include: {
              members: {
                where: { userId: req.user.id }
              }
            }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, isActive: true }
      })
    ]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!assignee || !assignee.isActive) {
      return res.status(400).json({ error: 'Invalid assignee' });
    }

    const hasAccess = project.workspace.ownerId === req.user.id ||
      project.workspace.members.length > 0 ||
      project.team_lead === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        type,
        priority,
        assigneeId,
        projectId,
        due_date: new Date(due_date)
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true }
        },
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: req.user.id }
                }
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const hasAccess = task.project.workspace.ownerId === req.user.id ||
      task.project.workspace.members.length > 0 ||
      task.project.team_lead === req.user.id ||
      task.assigneeId === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.put('/:id', validateRequest(createTaskSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, type, priority, assigneeId, due_date } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user can update task
    const canUpdate = task.project.workspace.ownerId === req.user.id ||
      task.project.team_lead === req.user.id ||
      task.assigneeId === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        type,
        priority,
        assigneeId,
        due_date: new Date(due_date)
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({ task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user can delete task
    const canDelete = task.project.workspace.ownerId === req.user.id ||
      task.project.team_lead === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task dependencies
router.get('/:id/dependencies', async (req, res) => {
  try {
    // This would require a TaskDependency model in schema
    // For now, return empty array
    res.json({ dependencies: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add task dependency
router.post('/:id/dependencies', async (req, res) => {
  try {
    const { dependsOnTaskId } = req.body;
    // Implementation would require TaskDependency model
    res.json({ success: true, message: 'Dependency feature coming soon' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task time tracking
router.get('/:id/time', async (req, res) => {
  try {
    // This would require a TimeEntry model
    res.json({ timeEntries: [], totalTime: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add time entry
router.post('/:id/time', async (req, res) => {
  try {
    const { hours, description, date } = req.body;
    // Implementation would require TimeEntry model
    res.json({ success: true, message: 'Time tracking feature coming soon' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task activity/history
router.get('/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get comments as activity for now
    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const activity = comments.map(comment => ({
      id: comment.id,
      type: 'comment',
      action: 'added comment',
      content: comment.content,
      user: comment.user,
      createdAt: comment.createdAt
    }));
    
    res.json({ activity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to task
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check task access
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId: req.user.id }
                }
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const hasAccess = task.project.workspace.ownerId === req.user.id ||
      task.project.workspace.members.length > 0 ||
      task.project.team_lead === req.user.id ||
      task.assigneeId === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: req.user.id,
        taskId: id
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comment
router.put('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    });
    
    res.json({ comment: updatedComment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await prisma.comment.delete({
      where: { id: commentId }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
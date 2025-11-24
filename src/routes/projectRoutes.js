import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, createProjectSchema } from '../utils/validation.js';
import { notificationService } from '../services/notificationService.js';
import { githubService } from '../services/githubService.js';
import { githubAuthService } from '../services/githubAuthService.js';

const router = express.Router();

// All project routes require authentication
router.use(authenticateToken);

// Get projects (by workspace)
router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    // Check workspace access
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId: req.user.id }
        }
      }
    });

    if (!workspace || (workspace.ownerId !== req.user.id && workspace.members.length === 0)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        tasks: {
          select: { id: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', validateRequest(createProjectSchema), async (req, res) => {
  try {
    const { name, description, priority, status, start_date, end_date, workspaceId } = req.body;

    // Check workspace access
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId: req.user.id }
        }
      }
    });

    if (!workspace || (workspace.ownerId !== req.user.id && workspace.members.length === 0)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        priority,
        status,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        team_lead: req.user.id,
        workspaceId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        workspace: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        workspace: {
          select: { id: true, name: true, slug: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access through workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: project.workspaceId },
      include: {
        members: {
          where: { userId: req.user.id }
        }
      }
    });

    const hasAccess = workspace.ownerId === req.user.id || 
      workspace.members.length > 0 ||
      project.team_lead === req.user.id ||
      project.members.some(member => member.userId === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', validateRequest(createProjectSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, priority, status, start_date, end_date } = req.body;

    // Check if user is project owner or workspace owner
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workspace: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canUpdate = project.team_lead === req.user.id || 
      project.workspace.ownerId === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        priority,
        status,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        workspace: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    res.json({ project: updatedProject });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is project owner or workspace owner
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workspace: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canDelete = project.team_lead === req.user.id || 
      project.workspace.ownerId === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add member to project
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user is project owner or workspace owner
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canAddMember = project.team_lead === req.user.id || 
      project.workspace.ownerId === req.user.id;

    if (!canAddMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find user by email in workspace members
    const workspaceMember = project.workspace.members.find(
      member => member.user.email === email
    );

    if (!workspaceMember) {
      return res.status(404).json({ error: 'User not found in workspace' });
    }

    // Check if user is already a project member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: workspaceMember.userId,
          projectId: id
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a project member' });
    }

    // Add user to project
    await prisma.projectMember.create({
      data: {
        userId: workspaceMember.userId,
        projectId: id
      }
    });

    // Send notification to added user
    await notificationService.sendToUser(workspaceMember.userId, {
      type: 'success',
      title: 'Added to Project',
      message: `You have been added to project "${project.name}"`,
      data: { projectId: id, projectName: project.name }
    });

    // Notify other project members
    await notificationService.sendToProject(id, {
      type: 'info',
      title: 'New Team Member',
      message: `${workspaceMember.user.name || workspaceMember.user.email} joined the project`,
      data: { projectId: id, projectName: project.name }
    }, req.user.id);

    // Return updated project with members
    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    });

    res.json({ project: updatedProject });
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect GitHub repository
router.post('/:id/github', async (req, res) => {
  try {
    const { id } = req.params;
    const { githubRepo } = req.body; // Format: "owner/repo"

    if (!githubRepo || !githubRepo.includes('/')) {
      return res.status(400).json({ error: 'Invalid GitHub repository format. Use owner/repo' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: { workspace: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canConnect = project.team_lead === req.user.id || 
      project.workspace.ownerId === req.user.id;

    if (!canConnect) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [owner, repo] = githubRepo.split('/');
    
    try {
      // Get user's GitHub token
      const token = await githubAuthService.getUserToken(req.user.id);
      if (!token) {
        return res.status(401).json({ error: 'GitHub account not connected. Please connect your GitHub account first.' });
      }

      // Fetch GitHub data
      const [repoInfo, codeMetrics] = await Promise.all([
        githubService.getRepoInfo(owner, repo, token),
        githubService.getCodeMetrics(owner, repo, token)
      ]);

      const githubData = {
        ...repoInfo,
        codeMetrics,
        estimation: githubService.calculateCOCOMO(codeMetrics.estimatedLOC),
        lastSync: new Date().toISOString()
      };

      // Update project with GitHub data
      const updatedProject = await prisma.project.update({
        where: { id },
        data: {
          githubRepo,
          githubData
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          workspace: { select: { id: true, name: true } }
        }
      });

      res.json({ project: updatedProject });
    } catch (githubError) {
      return res.status(400).json({ error: `GitHub API error: ${githubError.message}` });
    }
  } catch (error) {
    console.error('Connect GitHub error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disconnect GitHub repository
router.delete('/:id/github', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { workspace: true }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canDisconnect = project.team_lead === req.user.id || 
      project.workspace.ownerId === req.user.id;

    if (!canDisconnect) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        githubRepo: null,
        githubData: null
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } }
      }
    });

    res.json({ project: updatedProject });
  } catch (error) {
    console.error('Disconnect GitHub error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync GitHub data
router.post('/:id/github/sync', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: { workspace: true }
    });

    if (!project || !project.githubRepo) {
      return res.status(404).json({ error: 'Project or GitHub repository not found' });
    }

    const canSync = project.team_lead === req.user.id || 
      project.workspace.ownerId === req.user.id;

    if (!canSync) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [owner, repo] = project.githubRepo.split('/');
    
    try {
      const token = await githubAuthService.getUserToken(req.user.id);
      if (!token) {
        return res.status(401).json({ error: 'GitHub account not connected' });
      }

      const [repoInfo, codeMetrics] = await Promise.all([
        githubService.getRepoInfo(owner, repo, token),
        githubService.getCodeMetrics(owner, repo, token)
      ]);

      const githubData = {
        ...repoInfo,
        codeMetrics,
        estimation: githubService.calculateCOCOMO(codeMetrics.estimatedLOC),
        lastSync: new Date().toISOString()
      };

      const updatedProject = await prisma.project.update({
        where: { id },
        data: { githubData },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          workspace: { select: { id: true, name: true } }
        }
      });

      res.json({ project: updatedProject });
    } catch (githubError) {
      return res.status(400).json({ error: `GitHub API error: ${githubError.message}` });
    }
  } catch (error) {
    console.error('Sync GitHub error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Check if user is project owner or workspace owner
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workspace: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canRemoveMember = project.team_lead === req.user.id || 
      project.workspace.ownerId === req.user.id;

    if (!canRemoveMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user info before deletion
    const userToRemove = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    // Remove user from project
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId: id
        }
      }
    });

    // Notify removed user
    await notificationService.sendToUser(userId, {
      type: 'warning',
      title: 'Removed from Project',
      message: `You have been removed from project "${project.name}"`,
      data: { projectId: id, projectName: project.name }
    });

    // Notify other project members
    await notificationService.sendToProject(id, {
      type: 'info',
      title: 'Team Member Left',
      message: `${userToRemove?.name || userToRemove?.email} was removed from the project`,
      data: { projectId: id, projectName: project.name }
    }, req.user.id);

    // Return updated project with members
    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    });

    res.json({ project: updatedProject });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
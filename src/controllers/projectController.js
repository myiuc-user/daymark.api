import { projectService } from '../services/projectService.js';
import { ROLE_HIERARCHY } from '../utils/permissions.js';

export const projectController = {
  getProjects: async (req, res) => {
    try {
      const { workspaceId } = req.query;
      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required' });
      }

      const projects = await projectService.getProjects(workspaceId, req.user.id, req.user.role);
      res.json({ projects });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(403).json({ error: error.message || 'Internal server error' });
    }
  },

  createProject: async (req, res) => {
    try {
      const { name, description, priority, status, start_date, end_date, workspaceId } = req.body;
      const project = await projectService.createProject({
        name,
        description,
        priority,
        status,
        start_date,
        end_date,
        team_lead: req.user.id,
        workspaceId
      }, req.user.id, req.user.role);
      res.status(201).json({ project });
    } catch (error) {
      console.error('Create project error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getProject: async (req, res) => {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const hasAccess = await projectService.checkProjectAccess(project, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ project });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, priority, status, start_date, end_date } = req.body;

      const project = await projectService.getProjectById(id, { include: { workspace: true } });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const canUpdate = isSuperAdmin || project.team_lead === req.user.id || project.workspace.ownerId === req.user.id;
      if (!canUpdate) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedProject = await projectService.updateProject(id, {
        name,
        description,
        priority,
        status,
        start_date,
        end_date
      });

      res.json({ project: updatedProject });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;

      const project = await projectService.getProjectById(id, { include: { workspace: true } });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const canDelete = isSuperAdmin || project.team_lead === req.user.id || project.workspace.ownerId === req.user.id;
      if (!canDelete) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await projectService.deleteProject(id);
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getMembers: async (req, res) => {
    try {
      const { id } = req.params;
      const members = await projectService.getProjectMembers(id);
      res.json({ members });
    } catch (error) {
      console.error('Get project members error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getAssignees: async (req, res) => {
    try {
      const { id } = req.params;
      const assignees = await projectService.getProjectAssignees(id);
      res.json({ assignees });
    } catch (error) {
      console.error('Get assignees error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  addMember: async (req, res) => {
    try {
      const { id } = req.params;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const project = await projectService.getProjectById(id, { 
        include: { 
          workspace: {
            include: {
              members: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          }
        } 
      });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const canAdd = isSuperAdmin || project.team_lead === req.user.id || project.workspace.ownerId === req.user.id;
      if (!canAdd) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedProject = await projectService.addMember(id, email, project);
      res.json({ project: updatedProject });
    } catch (error) {
      console.error('Add project member error:', error);
      res.status(400).json({ error: error.message || 'Internal server error' });
    }
  },

  removeMember: async (req, res) => {
    try {
      const { id, userId } = req.params;

      const project = await projectService.getProjectById(id, { include: { workspace: true } });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const canRemove = isSuperAdmin || project.team_lead === req.user.id || project.workspace.ownerId === req.user.id;
      if (!canRemove) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedProject = await projectService.removeMember(id, userId);
      res.json({ project: updatedProject });
    } catch (error) {
      console.error('Remove project member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  connectGithub: async (req, res) => {
    try {
      const { id } = req.params;
      const { githubRepo } = req.body;

      if (!githubRepo || !githubRepo.includes('/')) {
        return res.status(400).json({ error: 'Invalid GitHub repository format. Use owner/repo' });
      }

      const project = await projectService.getProjectById(id, { include: { workspace: true } });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const canConnect = isSuperAdmin || project.team_lead === req.user.id || project.workspace.ownerId === req.user.id;
      if (!canConnect) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedProject = await projectService.connectGithub(id, githubRepo, req.user.id);
      res.json({ project: updatedProject });
    } catch (error) {
      console.error('Connect GitHub error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  disconnectGithub: async (req, res) => {
    try {
      const { id } = req.params;

      const project = await projectService.getProjectById(id, { include: { workspace: true } });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const canDisconnect = isSuperAdmin || project.team_lead === req.user.id || project.workspace.ownerId === req.user.id;
      if (!canDisconnect) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedProject = await projectService.disconnectGithub(id);
      res.json({ project: updatedProject });
    } catch (error) {
      console.error('Disconnect GitHub error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  syncGithub: async (req, res) => {
    try {
      const { id } = req.params;

      const project = await projectService.getProjectById(id, { include: { workspace: true } });
      if (!project || !project.githubRepo) {
        return res.status(404).json({ error: 'Project or GitHub repository not found' });
      }

      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const canSync = isSuperAdmin || project.team_lead === req.user.id || project.workspace.ownerId === req.user.id;
      if (!canSync) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedProject = await projectService.syncGithub(id, req.user.id);
      res.json({ project: updatedProject });
    } catch (error) {
      console.error('Sync GitHub error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  updateMemberPermissions: async (req, res) => {
    try {
      const { id, userId } = req.params;
      const { permissions } = req.body;
      
      const updated = await projectService.updateMemberPermissions(id, userId, permissions);
      res.json(updated);
    } catch (error) {
      console.error('Update member permissions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateMemberRole: async (req, res) => {
    try {
      const { id, userId } = req.params;
      const { role } = req.body;

      const project = await projectService.getProjectById(id, { include: { workspace: true } });
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
      const canUpdate = isSuperAdmin || project.team_lead === req.user.id || project.workspace.ownerId === req.user.id;
      if (!canUpdate) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const member = await projectService.updateMemberRole(id, userId, role);
      res.json({ member });
    } catch (error) {
      console.error('Update member role error:', error);
      if (error.message.includes('Invalid role')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

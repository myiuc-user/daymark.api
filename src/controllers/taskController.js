import { taskService } from '../services/taskService.js';

export const taskController = {
  getTasks: async (req, res) => {
    try {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const tasks = await taskService.getTasks(projectId, req.user.id);
      res.json({ tasks });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  createTask: async (req, res) => {
    try {
      const { title, description, priority, status, dueDate, projectId, assigneeId } = req.body;
      const task = await taskService.createTask({
        title,
        description,
        priority,
        status,
        dueDate,
        projectId,
        assigneeId,
        createdById: req.user.id
      }, req.user.id);
      res.status(201).json({ task });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  getTask: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ task });
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, priority, status, dueDate, assigneeId } = req.body;

      const task = await taskService.getTaskById(id, { include: { project: { include: { workspace: true } } } });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const canUpdate = await taskService.checkTaskUpdateAccess(task, req.user.id);
      if (!canUpdate) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedTask = await taskService.updateTask(id, {
        title,
        description,
        priority,
        status,
        dueDate,
        assigneeId
      }, req.user.id);

      res.json({ task: updatedTask });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteTask: async (req, res) => {
    try {
      const { id } = req.params;

      const task = await taskService.getTaskById(id, { include: { project: { include: { workspace: true } } } });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const canDelete = await taskService.checkTaskUpdateAccess(task, req.user.id);
      if (!canDelete) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await taskService.deleteTask(id);
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  addComment: async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const comment = await taskService.addComment(id, content, req.user.id);
      res.status(201).json({ comment });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getComments: async (req, res) => {
    try {
      const { id } = req.params;

      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const comments = await taskService.getComments(id);
      res.json({ comments });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getWatchers: async (req, res) => {
    try {
      const { id } = req.params;

      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const watchers = await taskService.getWatchers(id);
      res.json({ watchers });
    } catch (error) {
      console.error('Get watchers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  addWatcher: async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await taskService.addWatcher(id, userId);
      res.json({ message: 'Watcher added' });
    } catch (error) {
      console.error('Add watcher error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  removeWatcher: async (req, res) => {
    try {
      const { id, userId } = req.params;

      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await taskService.removeWatcher(id, userId);
      res.json({ message: 'Watcher removed' });
    } catch (error) {
      console.error('Remove watcher error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getSubtasks: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const subtasks = await taskService.getSubtasks(id);
      res.json({ subtasks });
    } catch (error) {
      console.error('Get subtasks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createSubtask: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, assigneeId, dueDate, priority } = req.body;
      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const subtask = await taskService.createSubtask(id, { title, assigneeId, dueDate, priority }, req.user.id);
      res.status(201).json({ subtask });
    } catch (error) {
      console.error('Create subtask error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  toggleSubtaskStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const subtask = await taskService.getTaskById(id);
      if (!subtask) {
        return res.status(404).json({ error: 'Subtask not found' });
      }
      const hasAccess = await taskService.checkTaskAccess(subtask, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const updated = await taskService.toggleSubtaskStatus(id);
      res.json({ subtask: updated });
    } catch (error) {
      console.error('Toggle subtask status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateTaskStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updated = await taskService.updateTaskStatus(id, status);
      res.json({ task: updated });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  toggleFavorite: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const updatedTask = await taskService.toggleFavorite(id);
      res.json({ task: updatedTask });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  toggleArchive: async (req, res) => {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      const hasAccess = await taskService.checkTaskAccess(task, req.user.id);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const updatedTask = await taskService.toggleArchive(id);
      res.json({ task: updatedTask });
    } catch (error) {
      console.error('Toggle archive error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

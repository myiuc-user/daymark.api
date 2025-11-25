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
      });

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
  }
};

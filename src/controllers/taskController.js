import { taskService } from '../services/taskService.js';
import { notificationService } from '../services/notificationService.js';
import { workflowService } from '../services/workflowService.js';

export const taskController = {
  getTasks: async (req, res) => {
    try {
      const { projectId, workspaceId } = req.query;
      
      if (workspaceId) {
        const tasks = await taskService.getTasksByWorkspace(workspaceId, req.user.id);
        return res.json({ tasks });
      }
      
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID or Workspace ID is required' });
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
      const { title, description, priority, status, due_date, projectId, assigneeId } = req.body;
      const task = await taskService.createTask({
        title,
        description,
        priority,
        status,
        due_date,
        projectId,
        assigneeId,
        createdById: req.user.id
      }, req.user.id, req.user.role);

      if (assigneeId && assigneeId !== req.user.id) {
        await notificationService.notifyTaskAssignment(task.id, assigneeId, req.user.id);
      }

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

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
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
      const { title, description, priority, status, due_date, assigneeId } = req.body;

      const task = await taskService.getTaskById(id, { include: { project: { include: { workspace: true } } } });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const canUpdate = await taskService.checkTaskUpdateAccess(task, req.user.id, req.user.role);
      if (!canUpdate) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const changes = {};
      if (title && title !== task.title) changes.title = title;
      if (priority && priority !== task.priority) changes.priority = priority;
      if (status && status !== task.status) changes.status = status;
      if (due_date && due_date !== task.due_date) changes.due_date = due_date;
      if (assigneeId && assigneeId !== task.assigneeId) {
        changes.assigneeId = assigneeId;
        await notificationService.notifyTaskAssignment(id, assigneeId, req.user.id);
      }

      const updatedTask = await taskService.updateTask(id, {
        title,
        description,
        priority,
        status,
        due_date,
        assigneeId
      }, req.user.id);

      if (Object.keys(changes).length > 0) {
        await notificationService.notifyTaskUpdate(id, req.user.id, changes);
      }

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

      const canDelete = await taskService.checkTaskUpdateAccess(task, req.user.id, req.user.role);
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

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const comment = await taskService.addComment(id, content, req.user.id);
      await notificationService.notifyTaskComment(id, req.user.id, task.createdById);

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

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
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

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
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

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
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

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
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
      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
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
      const { title, assigneeId, due_date, priority } = req.body;
      const task = await taskService.getTaskById(id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const subtask = await taskService.createSubtask(id, { title, assigneeId, due_date, priority }, req.user.id);
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
      const hasAccess = await taskService.checkTaskAccess(subtask, req.user.id, req.user.role);
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

      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updated = await taskService.updateTaskStatus(id, status);

      const isCompleted = await workflowService.isTaskCompleted(id);
      if (isCompleted) {
        await notificationService.notifyTaskCompleted(id, req.user.id);
      }

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
      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
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
      const hasAccess = await taskService.checkTaskAccess(task, req.user.id, req.user.role);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const updatedTask = await taskService.toggleArchive(id);
      res.json({ task: updatedTask });
    } catch (error) {
      console.error('Toggle archive error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  addDependency: async (req, res) => {
    try {
      const { taskId } = req.params;
      const { dependsOnId, dependencyType } = req.body;

      const hasCycle = await taskService.hasCyclicDependency(taskId, dependsOnId);
      if (hasCycle) {
        return res.status(400).json({ error: 'Cyclic dependency detected' });
      }

      const dependency = await taskService.addDependency(taskId, dependsOnId, dependencyType);
      res.status(201).json({ dependency });
    } catch (error) {
      console.error('Add dependency error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  removeDependency: async (req, res) => {
    try {
      const { taskId, dependsOnId } = req.params;
      await taskService.removeDependency(taskId, dependsOnId);
      res.json({ message: 'Dependency removed' });
    } catch (error) {
      console.error('Remove dependency error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getTaskDependencies: async (req, res) => {
    try {
      const { taskId } = req.params;
      const dependencies = await taskService.getTaskDependencies(taskId);
      res.json({ dependencies });
    } catch (error) {
      console.error('Get dependencies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getBlockingTasks: async (req, res) => {
    try {
      const { taskId } = req.params;
      const blocking = await taskService.getBlockingTasks(taskId);
      res.json({ blocking });
    } catch (error) {
      console.error('Get blocking tasks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getTaskHistory: async (req, res) => {
    try {
      const { taskId } = req.params;
      const history = await taskService.getTaskHistory(taskId);
      res.json({ history });
    } catch (error) {
      console.error('Get task history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createRecurringTask: async (req, res) => {
    try {
      const { projectId, title, description, frequency, dayOfWeek, dayOfMonth, nextDueDate } = req.body;
      
      const recurring = await taskService.createRecurringTask(projectId, {
        title,
        description,
        frequency,
        dayOfWeek,
        dayOfMonth,
        nextDueDate
      }, req.user.id);
      
      res.status(201).json({ recurringTask: recurring });
    } catch (error) {
      console.error('Create recurring task error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getRecurringTasks: async (req, res) => {
    try {
      const { projectId } = req.query;
      const recurring = await taskService.getRecurringTasks(projectId);
      res.json({ recurringTasks: recurring });
    } catch (error) {
      console.error('Get recurring tasks error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  updateRecurringTask: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, frequency, dayOfWeek, dayOfMonth } = req.body;
      
      const recurring = await taskService.updateRecurringTask(id, {
        title,
        description,
        frequency,
        dayOfWeek,
        dayOfMonth
      });
      
      res.json({ recurringTask: recurring });
    } catch (error) {
      console.error('Update recurring task error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteRecurringTask: async (req, res) => {
    try {
      const { id } = req.params;
      await taskService.deleteRecurringTask(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete recurring task error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

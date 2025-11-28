import { taskDependencyService } from '../services/taskDependencyService.js';

export const taskDependencyController = {
  addDependency: async (req, res) => {
    try {
      const { taskId } = req.params;
      const { dependsOnId, dependencyType } = req.body;

      const hasCycle = await taskDependencyService.hasCyclicDependency(taskId, dependsOnId);
      if (hasCycle) {
        return res.status(400).json({ error: 'Cyclic dependency detected' });
      }

      const dependency = await taskDependencyService.addDependency(taskId, dependsOnId, dependencyType);
      res.status(201).json({ dependency });
    } catch (error) {
      console.error('Add dependency error:', error);
      res.status(400).json({ error: error.message });
    }
  },

  removeDependency: async (req, res) => {
    try {
      const { taskId, dependsOnId } = req.params;
      await taskDependencyService.removeDependency(taskId, dependsOnId);
      res.json({ message: 'Dependency removed' });
    } catch (error) {
      console.error('Remove dependency error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getTaskDependencies: async (req, res) => {
    try {
      const { taskId } = req.params;
      const dependencies = await taskDependencyService.getTaskDependencies(taskId);
      res.json({ dependencies });
    } catch (error) {
      console.error('Get dependencies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getBlockingTasks: async (req, res) => {
    try {
      const { taskId } = req.params;
      const blocking = await taskDependencyService.getBlockingTasks(taskId);
      res.json({ blocking });
    } catch (error) {
      console.error('Get blocking tasks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

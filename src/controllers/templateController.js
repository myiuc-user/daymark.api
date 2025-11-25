import { templateService } from '../services/templateService.js';

export const templateController = {
  getTemplates: async (req, res) => {
    try {
      const templates = await templateService.getTemplates(req.user.id);
      res.json({ templates });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createTemplate: async (req, res) => {
    try {
      const { name, description, content } = req.body;
      const template = await templateService.createTemplate({
        name,
        description,
        content,
        createdById: req.user.id
      });
      res.status(201).json({ template });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      await templateService.deleteTemplate(id, req.user.id);
      res.json({ message: 'Template deleted' });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

import { templateService } from '../services/templateService.js';

export const templateController = {
  createTemplate: async (req, res) => {
    try {
      const { name, description, data, isPublic } = req.body;
      const template = await templateService.createTemplate({
        name,
        description,
        data,
        isPublic,
        createdById: req.user.id
      });
      res.status(201).json({ template });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getTemplates: async (req, res) => {
    try {
      const templates = await templateService.getTemplates(req.user.id);
      res.json({ templates });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  useTemplate: async (req, res) => {
    try {
      const { templateId, projectName } = req.body;
      const project = await templateService.useTemplate(templateId, projectName, req.user.id);
      res.status(201).json({ project });
    } catch (error) {
      console.error('Use template error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      await templateService.deleteTemplate(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

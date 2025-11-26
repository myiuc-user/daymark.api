import { fileService } from '../services/fileService.js';

export const fileController = {
  uploadFile: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const file = await fileService.uploadFile(req.file, req.user.id);
      res.status(201).json({ file });
    } catch (error) {
      console.error('Upload file error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  listProjectFiles: async (req, res) => {
    try {
      const { projectId } = req.params;
      const files = await fileService.listProjectFiles(projectId, req.user.id);
      res.json({ files });
    } catch (error) {
      console.error('List files error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  deleteFile: async (req, res) => {
    try {
      const { id } = req.params;
      await fileService.deleteFile(id, req.user.id);
      res.json({ message: 'File deleted' });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};

import { dataExportService } from '../services/dataExportService.js';

export const dataExportController = {
  exportData: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await dataExportService.exportUserData(userId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="daymark-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(data);
    } catch (error) {
      console.error('Export data error:', error);
      res.status(500).json({ error: error.message || 'Failed to export data' });
    }
  },

  importData: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const importData = req.body;

      if (!importData || !importData.data) {
        return res.status(400).json({ error: 'Invalid import data format' });
      }

      // Preserve SUPER_ADMIN role - never downgrade it during import
      if (userRole === 'SUPER_ADMIN' && importData.user?.role !== 'SUPER_ADMIN') {
        importData.user = importData.user || {};
        importData.user.role = 'SUPER_ADMIN';
      }

      const results = await dataExportService.importUserData(userId, importData);
      res.json({
        message: 'Data imported successfully',
        results,
      });
    } catch (error) {
      console.error('Import data error:', error);
      res.status(400).json({ error: error.message || 'Failed to import data' });
    }
  },
};

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads/profiles');

export const imageService = {
  compressProfilePhoto: async (filePath) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      
      const outputPath = filePath.replace(/\.jpg$/, '-compressed.jpg');
      
      await sharp(filePath)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80, progressive: true })
        .toFile(outputPath);

      await fs.unlink(filePath);
      return outputPath;
    } catch (error) {
      throw new Error(`Image compression failed: ${error.message}`);
    }
  },

  deleteProfilePhoto: async (filePath) => {
    try {
      if (filePath && filePath.startsWith('/uploads/')) {
        const fullPath = path.join(process.cwd(), filePath);
        await fs.unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
};

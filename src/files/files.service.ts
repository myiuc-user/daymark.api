import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private minioClient: Minio.Client;
  private bucketName = 'daymark';

  constructor(private prisma: PrismaService) {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    });
    this.initializeBucket();
  }

  private async initializeBucket() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`Bucket '${this.bucketName}' created successfully`);
      }
    } catch (error) {
      console.error('Error initializing MinIO bucket:', error);
    }
  }

  async upload(file: Express.Multer.File, userId: string, projectId?: string) {
    try {
      const fileName = `${Date.now()}-${file.originalname}`;
      const objectName = projectId ? `projects/${projectId}/${fileName}` : `reports/${fileName}`;
      
      // Upload to MinIO
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        fs.createReadStream(file.path),
        file.size,
        {
          'Content-Type': file.mimetype,
          'Original-Name': file.originalname
        }
      );
      
      // Clean up local file
      fs.unlinkSync(file.path);
      
      // Save to database
      return this.prisma.file.create({
        data: {
          name: file.originalname,
          filename: file.originalname,
          path: objectName,
          size: file.size,
          mimetype: file.mimetype,
          uploadedById: userId,
          projectId
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    return this.prisma.file.findUnique({ where: { id } });
  }

  async getFileStream(id: string) {
    const file = await this.findOne(id);
    if (!file) throw new Error('File not found');
    
    return this.minioClient.getObject(this.bucketName, file.path);
  }

  async delete(id: string) {
    const file = await this.findOne(id);
    if (!file) throw new Error('File not found');
    
    // Delete from MinIO
    await this.minioClient.removeObject(this.bucketName, file.path);
    
    // Delete from database
    return this.prisma.file.delete({ where: { id } });
  }

  async getProjectFiles(projectId: string) {
    const files = await this.prisma.file.findMany({
      where: { projectId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return files || [];
  }
}

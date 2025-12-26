import { Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Req, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtGuard } from '../common/guards/jwt.guard';
import { Response } from 'express';

@Controller('files')
@UseGuards(JwtGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const userId = req.user.id;
    const projectId = req.body.projectId;
    return this.filesService.upload(file, userId, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.filesService.findOne(id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    const stream = await this.filesService.getFileStream(id);
    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    stream.pipe(res);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.filesService.delete(id);
  }

  @Get('list/project/:projectId')
  getProjectFiles(@Param('projectId') projectId: string) {
    return this.filesService.getProjectFiles(projectId);
  }
}

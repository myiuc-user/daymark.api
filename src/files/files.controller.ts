import { Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtGuard } from '../common/guards/jwt.guard';

@Controller('files')
@UseGuards(JwtGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.upload({ filename: file.filename, path: file.path });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.filesService.delete(id);
  }
}

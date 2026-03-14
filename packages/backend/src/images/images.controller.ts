import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('releases/:releaseId/images')
export class ImagesController {
  constructor(private images: ImagesService) {}

  @Get()
  findAll(@Param('releaseId') releaseId: string) {
    return this.images.findByRelease(releaseId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(
    @Param('releaseId') releaseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.images.upload(releaseId, file);
  }

  @Put(':imageId/alt/:langId')
  setAltText(
    @Param('imageId') imageId: string,
    @Param('langId') langId: string,
    @Body() body: { alternateName: string },
  ) {
    return this.images.setAltText(imageId, langId, body.alternateName);
  }

  @Delete(':imageId')
  delete(@Param('imageId') imageId: string) {
    return this.images.delete(imageId);
  }
}

// Separate controller for serving files (no auth required for public images)
@Controller('files')
export class FilesController {
  constructor(private images: ImagesService) {}

  @Get('images/:releaseId/:filename')
  async serveFile(
    @Param('releaseId') releaseId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const buffer = await this.images.getFile(`images/${releaseId}/${filename}`);
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    res.type(mimeTypes[ext ?? 'jpg'] ?? 'application/octet-stream').send(buffer);
  }
}

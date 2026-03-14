import { Injectable, NotFoundException } from '@nestjs/common';
import * as sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const IMAGE_SIZES = {
  original: null,
  large: { width: 1200, height: 800 },
  medium: { width: 600, height: 400 },
  thumbnail: { width: 150, height: 150 },
} as const;

@Injectable()
export class ImagesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async upload(
    releaseId: string,
    file: Express.Multer.File,
  ) {
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Save scaled versions
    for (const [sizeName, dimensions] of Object.entries(IMAGE_SIZES)) {
      let buffer: Buffer;
      if (dimensions) {
        buffer = await (sharp as unknown as typeof sharp.default)(file.buffer)
          .resize(dimensions.width, dimensions.height, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();
      } else {
        buffer = file.buffer;
      }
      await this.storage.save(
        `images/${releaseId}/${baseName}-${sizeName}.${ext}`,
        buffer,
      );
    }

    const filePath = `images/${releaseId}/${baseName}-original.${ext}`;

    const image = await this.prisma.newsReleaseImage.create({
      data: {
        releaseId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        filePath,
      },
      include: { languages: true },
    });

    return image;
  }

  async findByRelease(releaseId: string) {
    return this.prisma.newsReleaseImage.findMany({
      where: { releaseId },
      orderBy: { sortOrder: 'asc' },
      include: { languages: true },
    });
  }

  async setAltText(imageId: string, languageId: string, alternateName: string) {
    return this.prisma.newsReleaseImageLanguage.upsert({
      where: { imageId_languageId: { imageId, languageId } },
      update: { alternateName },
      create: { imageId, languageId, alternateName },
    });
  }

  async delete(imageId: string) {
    const image = await this.prisma.newsReleaseImage.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Image not found');

    // Delete all size variants from storage
    const basePath = image.filePath.replace('-original', '');
    const ext = image.filePath.split('.').pop();
    for (const sizeName of Object.keys(IMAGE_SIZES)) {
      await this.storage.delete(basePath.replace(`.${ext}`, '') + `-${sizeName}.${ext}`);
    }

    return this.prisma.newsReleaseImage.delete({ where: { id: imageId } });
  }

  async getFile(relativePath: string): Promise<Buffer> {
    return this.storage.read(relativePath);
  }
}

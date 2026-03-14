import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';

@Injectable()
export class StorageService {
  private readonly basePath: string;

  constructor(private config: ConfigService) {
    this.basePath = config.get('STORAGE_PATH', join(process.cwd(), 'uploads'));
  }

  async save(relativePath: string, data: Buffer): Promise<string> {
    const fullPath = join(this.basePath, relativePath);
    await fs.mkdir(dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
    return relativePath;
  }

  async read(relativePath: string): Promise<Buffer> {
    const fullPath = join(this.basePath, relativePath);
    return fs.readFile(fullPath);
  }

  async delete(relativePath: string): Promise<void> {
    const fullPath = join(this.basePath, relativePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  async exists(relativePath: string): Promise<boolean> {
    const fullPath = join(this.basePath, relativePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(relativePath: string): string {
    return `/api/files/${relativePath}`;
  }
}

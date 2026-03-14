import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('StorageService', () => {
  let service: StorageService;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `nrms-test-${Date.now()}`);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: { get: (key: string, def?: string) => key === 'STORAGE_PATH' ? testDir : def },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should save and read a file', async () => {
    const data = Buffer.from('hello world');
    await service.save('test/file.txt', data);
    const read = await service.read('test/file.txt');
    expect(read.toString()).toBe('hello world');
  });

  it('should check existence', async () => {
    expect(await service.exists('nonexistent.txt')).toBe(false);
    await service.save('exists.txt', Buffer.from('data'));
    expect(await service.exists('exists.txt')).toBe(true);
  });

  it('should delete a file', async () => {
    await service.save('deleteme.txt', Buffer.from('data'));
    await service.delete('deleteme.txt');
    expect(await service.exists('deleteme.txt')).toBe(false);
  });
});

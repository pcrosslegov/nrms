import { Test, TestingModule } from '@nestjs/testing';
import { ReleasesService } from './releases.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReleasesService', () => {
  let service: ReleasesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      newsRelease: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReleasesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReleasesService>(ReleasesService);
  });

  describe('findAll', () => {
    it('should return paginated results for drafts tab', async () => {
      prisma.newsRelease.findMany.mockResolvedValue([]);
      prisma.newsRelease.count.mockResolvedValue(0);

      const result = await service.findAll({ tab: 'drafts' });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);

      const call = prisma.newsRelease.findMany.mock.calls[0][0];
      expect(call.where.isCommitted).toBe(false);
      expect(call.where.isPublished).toBe(false);
    });

    it('should filter by scheduled tab', async () => {
      await service.findAll({ tab: 'scheduled' });
      const call = prisma.newsRelease.findMany.mock.calls[0][0];
      expect(call.where.isCommitted).toBe(true);
      expect(call.where.isPublished).toBe(false);
    });

    it('should filter by published tab', async () => {
      await service.findAll({ tab: 'published' });
      const call = prisma.newsRelease.findMany.mock.calls[0][0];
      expect(call.where.isPublished).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a release with default EN document', async () => {
      const mockRelease = { id: 'r-1', releaseType: 'RELEASE' };
      prisma.newsRelease.create.mockResolvedValue(mockRelease);

      const result = await service.create({});
      expect(prisma.newsRelease.create).toHaveBeenCalled();
      expect(result).toEqual(mockRelease);
    });
  });

  describe('softDelete', () => {
    it('should set isActive to false', async () => {
      prisma.newsRelease.update.mockResolvedValue({ id: 'r-1', isActive: false });

      await service.softDelete('r-1');
      expect(prisma.newsRelease.update).toHaveBeenCalledWith({
        where: { id: 'r-1' },
        data: { isActive: false },
      });
    });
  });
});

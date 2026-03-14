import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { PrismaService } from '../prisma/prisma.service';
import { GenerationService } from '../generation/generation.service';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let prisma: any;
  let generation: any;

  beforeEach(async () => {
    prisma = {
      newsRelease: {
        findUniqueOrThrow: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn(),
      },
      newsReleaseLog: { create: jest.fn().mockResolvedValue({}) },
      newsReleaseHistory: { create: jest.fn().mockResolvedValue({}) },
      $queryRawUnsafe: jest.fn().mockResolvedValue([{ nextval: 42n }]),
    };
    generation = {
      generateHtml: jest.fn().mockReturnValue('<html>test</html>'),
      generateTxt: jest.fn().mockReturnValue('test txt'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: GenerationService, useValue: generation },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  describe('approve', () => {
    it('should generate NEWS-##### reference and key slug', async () => {
      prisma.newsRelease.findUniqueOrThrow.mockResolvedValue({
        id: 'r-1',
        reference: '',
        releaseType: 'RELEASE',
        ministry: { abbreviation: 'DH', displayName: 'Dept of Health' },
        ministryId: 'm-1',
      });
      prisma.newsRelease.update.mockResolvedValue({ id: 'r-1', reference: 'NEWS-00042' });

      const result = await service.approve('r-1');

      const updateCall = prisma.newsRelease.update.mock.calls[0][0];
      expect(updateCall.data.reference).toBe('NEWS-00042');
      expect(updateCall.data.key).toMatch(/^\d{4}DH\d{4}-\d{6}$/);
      expect(updateCall.data.year).toBe(new Date().getFullYear());
    });

    it('should reject if already approved', async () => {
      prisma.newsRelease.findUniqueOrThrow.mockResolvedValue({
        id: 'r-1',
        reference: 'NEWS-00001',
        releaseType: 'RELEASE',
      });

      await expect(service.approve('r-1')).rejects.toThrow(BadRequestException);
    });

    it('should use ADVIS abbreviation for advisories', async () => {
      prisma.newsRelease.findUniqueOrThrow.mockResolvedValue({
        id: 'r-1',
        reference: '',
        releaseType: 'ADVISORY',
        ministry: null,
        ministryId: null,
      });
      prisma.newsRelease.update.mockResolvedValue({ id: 'r-1' });

      await service.approve('r-1');

      const updateCall = prisma.newsRelease.update.mock.calls[0][0];
      expect(updateCall.data.key).toContain('ADVIS');
    });
  });

  describe('schedule', () => {
    it('should reject unapproved releases', async () => {
      prisma.newsRelease.findUniqueOrThrow.mockResolvedValue({
        id: 'r-1',
        reference: '',
      });

      await expect(
        service.schedule('r-1', '2099-01-01T00:00:00Z'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject past dates', async () => {
      prisma.newsRelease.findUniqueOrThrow.mockResolvedValue({
        id: 'r-1',
        reference: 'NEWS-00001',
        isPublished: false,
      });

      await expect(
        service.schedule('r-1', '2020-01-01T00:00:00Z'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('publish', () => {
    it('should generate HTML and TXT and mark as published', async () => {
      prisma.newsRelease.findUniqueOrThrow.mockResolvedValue({
        id: 'r-1',
        reference: 'NEWS-00001',
        key: '2026DH0001-000001',
        releaseType: 'RELEASE',
        documents: [],
        languages: [],
        ministry: null,
      });
      prisma.newsRelease.update.mockResolvedValue({
        id: 'r-1',
        isPublished: true,
      });

      const result = await service.publish('r-1');

      expect(generation.generateHtml).toHaveBeenCalled();
      expect(generation.generateTxt).toHaveBeenCalled();
      expect(prisma.newsReleaseHistory.create).toHaveBeenCalledTimes(2);
      expect(result.generatedHtml).toBe('<html>test</html>');
    });
  });

  describe('unpublish', () => {
    it('should set isCommitted and isPublished to false', async () => {
      prisma.newsRelease.findUniqueOrThrow.mockResolvedValue({
        id: 'r-1',
        isPublished: true,
      });
      prisma.newsRelease.update.mockResolvedValue({
        id: 'r-1',
        isCommitted: false,
        isPublished: false,
      });

      await service.unpublish('r-1');

      const updateCall = prisma.newsRelease.update.mock.calls[0][0];
      expect(updateCall.data.isCommitted).toBe(false);
      expect(updateCall.data.isPublished).toBe(false);
    });
  });
});

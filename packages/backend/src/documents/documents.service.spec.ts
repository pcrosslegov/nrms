import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      newsReleaseDocument: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _max: { sortIndex: 0 } }),
      },
      newsReleaseDocumentLanguage: {
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      newsReleaseDocumentContact: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('createDocument', () => {
    it('should create with auto-incremented sortIndex', async () => {
      prisma.newsReleaseDocument.create.mockResolvedValue({
        id: 'd-1',
        sortIndex: 1,
      });

      await service.createDocument('r-1');
      expect(prisma.newsReleaseDocument.create).toHaveBeenCalled();
      const call = prisma.newsReleaseDocument.create.mock.calls[0][0];
      expect(call.data.sortIndex).toBe(1);
    });
  });

  describe('updateLanguage', () => {
    it('should sanitize HTML in bodyHtml', async () => {
      prisma.newsReleaseDocumentLanguage.upsert.mockResolvedValue({});

      await service.updateLanguage('d-1', 'en', {
        headline: 'Test',
        bodyHtml: '<p>Safe</p><script>alert("xss")</script>',
      });

      const call = prisma.newsReleaseDocumentLanguage.upsert.mock.calls[0][0];
      expect(call.update.bodyHtml).not.toContain('<script>');
      expect(call.update.bodyHtml).toContain('<p>Safe</p>');
    });
  });

  describe('setContacts', () => {
    it('should replace contacts for a document language', async () => {
      await service.setContacts('d-1', 'en', ['Contact A', 'Contact B']);
      expect(prisma.newsReleaseDocumentContact.deleteMany).toHaveBeenCalledWith({
        where: { documentId: 'd-1', languageId: 'en' },
      });
      expect(prisma.newsReleaseDocumentContact.createMany).toHaveBeenCalledWith({
        data: [
          { documentId: 'd-1', languageId: 'en', sortIndex: 0, information: 'Contact A' },
          { documentId: 'd-1', languageId: 'en', sortIndex: 1, information: 'Contact B' },
        ],
      });
    });
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'u', 'sup', 'sub', 'span',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['class', 'style'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findByRelease(releaseId: string) {
    return this.prisma.newsReleaseDocument.findMany({
      where: { releaseId },
      orderBy: { sortIndex: 'asc' },
      include: {
        languages: true,
        contacts: { orderBy: { sortIndex: 'asc' } },
      },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.newsReleaseDocument.findUnique({
      where: { id },
      include: {
        languages: true,
        contacts: { orderBy: { sortIndex: 'asc' } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async createDocument(releaseId: string, data?: { sortIndex?: number; pageLayout?: number }) {
    const maxSort = await this.prisma.newsReleaseDocument.aggregate({
      where: { releaseId },
      _max: { sortIndex: true },
    });
    const sortIndex = data?.sortIndex ?? ((maxSort._max.sortIndex ?? -1) + 1);

    return this.prisma.newsReleaseDocument.create({
      data: {
        releaseId,
        sortIndex,
        pageLayout: data?.pageLayout ?? 0,
        languages: {
          create: { languageId: 'en' },
        },
      },
      include: { languages: true },
    });
  }

  async deleteDocument(id: string) {
    return this.prisma.newsReleaseDocument.delete({ where: { id } });
  }

  async updateLanguage(
    documentId: string,
    languageId: string,
    data: {
      pageTitle?: string;
      organizations?: string;
      headline?: string;
      subheadline?: string;
      byline?: string;
      bodyHtml?: string;
    },
  ) {
    // Sanitize HTML if provided
    if (data.bodyHtml !== undefined) {
      data.bodyHtml = sanitizeHtml(data.bodyHtml, SANITIZE_OPTIONS);
    }

    return this.prisma.newsReleaseDocumentLanguage.upsert({
      where: {
        documentId_languageId: { documentId, languageId },
      },
      update: data,
      create: {
        documentId,
        languageId,
        ...data,
      },
    });
  }

  async deleteLanguage(documentId: string, languageId: string) {
    return this.prisma.newsReleaseDocumentLanguage.delete({
      where: {
        documentId_languageId: { documentId, languageId },
      },
    });
  }

  async setContacts(
    documentId: string,
    languageId: string,
    contacts: string[],
  ) {
    // Delete existing contacts for this doc+lang, then recreate
    await this.prisma.newsReleaseDocumentContact.deleteMany({
      where: { documentId, languageId },
    });

    if (contacts.length > 0) {
      await this.prisma.newsReleaseDocumentContact.createMany({
        data: contacts.map((info, idx) => ({
          documentId,
          languageId,
          sortIndex: idx,
          information: info,
        })),
      });
    }

    return this.prisma.newsReleaseDocumentContact.findMany({
      where: { documentId, languageId },
      orderBy: { sortIndex: 'asc' },
    });
  }
}

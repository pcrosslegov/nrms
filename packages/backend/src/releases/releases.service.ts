import { Injectable, NotFoundException } from '@nestjs/common';
import { ReleaseType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ReleasesFilter {
  tab?: 'drafts' | 'scheduled' | 'published';
  releaseType?: ReleaseType;
  ministryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ReleasesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: ReleasesFilter) {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 25;
    const skip = (page - 1) * pageSize;

    const where: any = { isActive: true };

    // Tab filters
    if (filter.tab === 'drafts') {
      where.isCommitted = false;
      where.isPublished = false;
    } else if (filter.tab === 'scheduled') {
      where.isCommitted = true;
      where.isPublished = false;
    } else if (filter.tab === 'published') {
      where.isPublished = true;
    }

    if (filter.releaseType) {
      where.releaseType = filter.releaseType;
    }
    if (filter.ministryId) {
      where.ministryId = filter.ministryId;
    }

    const [items, total] = await Promise.all([
      this.prisma.newsRelease.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          ministry: { select: { id: true, displayName: true, abbreviation: true } },
          languages: true,
          documents: {
            take: 1,
            orderBy: { sortIndex: 'asc' },
            include: {
              languages: {
                where: { languageId: 'en' },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.newsRelease.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const release = await this.prisma.newsRelease.findUnique({
      where: { id },
      include: {
        ministry: true,
        languages: true,
        documents: {
          orderBy: { sortIndex: 'asc' },
          include: {
            languages: true,
            contacts: { orderBy: { sortIndex: 'asc' } },
          },
        },
        ministries: { include: { ministry: true } },
        sectors: { include: { sector: true } },
        themes: { include: { theme: true } },
        tags: { include: { tag: true } },
        distributions: { include: { mediaDistribution: true } },
        logs: { orderBy: { dateTime: 'desc' }, take: 50 },
      },
    });
    if (!release) throw new NotFoundException('Release not found');
    return release;
  }

  async create(data: {
    releaseType?: ReleaseType;
    ministryId?: string;
  }) {
    // Generate a temporary unique key (replaced on Approve with proper slug)
    const tempKey = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const release = await this.prisma.newsRelease.create({
      data: {
        releaseType: data.releaseType ?? ReleaseType.RELEASE,
        key: tempKey,
        ministryId: data.ministryId,
        documents: {
          create: {
            sortIndex: 0,
            pageLayout: 0,
            languages: {
              create: { languageId: 'en' },
            },
          },
        },
        languages: {
          create: { languageId: 'en' },
        },
      },
      include: {
        documents: { include: { languages: true } },
        languages: true,
      },
    });
    return release;
  }

  async update(
    id: string,
    data: Partial<{
      releaseType: ReleaseType;
      ministryId: string;
      releaseDateTime: string;
      keywords: string;
      publishToWeb: boolean;
      publishToNewsOnDemand: boolean;
      publishToMediaDistribution: boolean;
      hasMediaAssets: boolean;
    }>,
  ) {
    return this.prisma.newsRelease.update({
      where: { id },
      data: {
        ...data,
        releaseDateTime: data.releaseDateTime
          ? new Date(data.releaseDateTime)
          : undefined,
      },
      include: { ministry: true },
    });
  }

  async updateLanguage(
    releaseId: string,
    languageId: string,
    data: {
      location?: string;
      summary?: string;
      socialMediaHeadline?: string;
      socialMediaSummary?: string;
    },
  ) {
    return this.prisma.newsReleaseLanguage.upsert({
      where: {
        releaseId_languageId: { releaseId, languageId },
      },
      update: data,
      create: { releaseId, languageId, ...data },
    });
  }

  async updateAssociations(
    id: string,
    data: {
      ministryIds?: string[];
      sectorIds?: string[];
      themeIds?: string[];
      tagIds?: string[];
      mediaDistributionListIds?: string[];
    },
  ) {
    const ops: any[] = [];

    if (data.ministryIds !== undefined) {
      ops.push(
        this.prisma.newsReleaseMinistry.deleteMany({ where: { releaseId: id } }),
        ...data.ministryIds.map((ministryId) =>
          this.prisma.newsReleaseMinistry.create({
            data: { releaseId: id, ministryId },
          }),
        ),
      );
    }

    if (data.sectorIds !== undefined) {
      ops.push(
        this.prisma.newsReleaseSector.deleteMany({ where: { releaseId: id } }),
        ...data.sectorIds.map((sectorId) =>
          this.prisma.newsReleaseSector.create({
            data: { releaseId: id, sectorId },
          }),
        ),
      );
    }

    if (data.themeIds !== undefined) {
      ops.push(
        this.prisma.newsReleaseTheme.deleteMany({ where: { releaseId: id } }),
        ...data.themeIds.map((themeId) =>
          this.prisma.newsReleaseTheme.create({
            data: { releaseId: id, themeId },
          }),
        ),
      );
    }

    if (data.tagIds !== undefined) {
      ops.push(
        this.prisma.newsReleaseTag.deleteMany({ where: { releaseId: id } }),
        ...data.tagIds.map((tagId) =>
          this.prisma.newsReleaseTag.create({
            data: { releaseId: id, tagId },
          }),
        ),
      );
    }

    if (data.mediaDistributionListIds !== undefined) {
      ops.push(
        this.prisma.newsReleaseMediaDistribution.deleteMany({ where: { releaseId: id } }),
        ...data.mediaDistributionListIds.map((mediaDistributionListId) =>
          this.prisma.newsReleaseMediaDistribution.create({
            data: { releaseId: id, mediaDistributionListId },
          }),
        ),
      );
    }

    if (ops.length > 0) {
      await this.prisma.$transaction(ops);
    }

    return this.findOne(id);
  }

  async softDelete(id: string) {
    return this.prisma.newsRelease.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

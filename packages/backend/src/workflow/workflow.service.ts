import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerationService } from '../generation/generation.service';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private generation: GenerationService,
  ) {}

  async approve(releaseId: string, userId?: string) {
    const release = await this.prisma.newsRelease.findUniqueOrThrow({
      where: { id: releaseId },
      include: { ministry: true },
    });

    if (release.reference && release.reference.startsWith('NEWS-')) {
      throw new BadRequestException('Release is already approved');
    }

    // For non-advisories, ministry must be set
    if (release.releaseType !== 'ADVISORY' && !release.ministry) {
      throw new BadRequestException('Ministry must be assigned before approval');
    }

    // Generate NEWS-##### reference using PostgreSQL sequence
    const [seqResult] = await this.prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
      "SELECT nextval('news_reference_seq')",
    );
    const seqNum = Number(seqResult.nextval);
    const reference = `NEWS-${String(seqNum).padStart(5, '0')}`;

    // Generate key slug: YYYY[MINISTRY_ABBR]MMMM-YYYYYY
    const year = new Date().getFullYear();
    const abbreviation =
      release.releaseType === 'ADVISORY'
        ? 'ADVIS'
        : release.ministry?.abbreviation ?? 'UNKN';

    // Get next serial for this ministry this year
    const ministryCount = await this.prisma.newsRelease.count({
      where: {
        year,
        ministryId: release.ministryId,
        reference: { not: '' },
      },
    });
    const ministrySerial = ministryCount + 1;

    // Get next serial for the year overall
    const yearCount = await this.prisma.newsRelease.count({
      where: {
        year,
        reference: { not: '' },
      },
    });
    const yearSerial = yearCount + 1;

    const key = `${year}${abbreviation}${String(ministrySerial).padStart(4, '0')}-${String(yearSerial).padStart(6, '0')}`;

    const updated = await this.prisma.newsRelease.update({
      where: { id: releaseId },
      data: {
        reference,
        key,
        year,
        yearRelease: yearSerial,
        ministryRelease: ministrySerial,
      },
      include: { ministry: true },
    });

    await this.log(releaseId, `Approved ${release.releaseType}`, userId);

    return updated;
  }

  async schedule(
    releaseId: string,
    publishDateTime: string,
    userId?: string,
  ) {
    const release = await this.prisma.newsRelease.findUniqueOrThrow({
      where: { id: releaseId },
    });

    if (!release.reference || !release.reference.startsWith('NEWS-')) {
      throw new BadRequestException('Release must be approved before scheduling');
    }

    if (release.isPublished) {
      throw new BadRequestException('Release is already published');
    }

    const scheduledTime = new Date(publishDateTime);
    if (scheduledTime <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const updated = await this.prisma.newsRelease.update({
      where: { id: releaseId },
      data: {
        isCommitted: true,
        publishDateTime: scheduledTime,
      },
    });

    await this.log(releaseId, 'Scheduled Release', userId);

    return updated;
  }

  async publish(releaseId: string, userId?: string) {
    const release = await this.prisma.newsRelease.findUniqueOrThrow({
      where: { id: releaseId },
      include: {
        ministry: true,
        documents: {
          orderBy: { sortIndex: 'asc' },
          include: {
            languages: true,
            contacts: { orderBy: { sortIndex: 'asc' } },
          },
        },
        languages: true,
      },
    });

    if (!release.reference || !release.reference.startsWith('NEWS-')) {
      throw new BadRequestException('Release must be approved before publishing');
    }

    // Generate HTML and TXT outputs
    const html = this.generation.generateHtml(release);
    const txt = this.generation.generateTxt(release);

    const now = new Date();

    // Store generation history
    await this.prisma.newsReleaseHistory.create({
      data: {
        releaseId,
        publishDateTime: now,
        mimeType: 'text/html',
        filePath: `releases/${release.key}/release.html`,
      },
    });

    await this.prisma.newsReleaseHistory.create({
      data: {
        releaseId,
        publishDateTime: now,
        mimeType: 'text/plain',
        filePath: `releases/${release.key}/release.txt`,
      },
    });

    const updated = await this.prisma.newsRelease.update({
      where: { id: releaseId },
      data: {
        isCommitted: true,
        isPublished: true,
        publishDateTime: now,
      },
    });

    await this.log(releaseId, 'Published Release', userId);

    return { ...updated, generatedHtml: html, generatedTxt: txt };
  }

  async unpublish(releaseId: string, userId?: string) {
    const release = await this.prisma.newsRelease.findUniqueOrThrow({
      where: { id: releaseId },
    });

    const description = release.isPublished
      ? 'Unpublished Release'
      : 'Cancelled Release';

    const updated = await this.prisma.newsRelease.update({
      where: { id: releaseId },
      data: {
        isCommitted: false,
        isPublished: false,
      },
    });

    await this.log(releaseId, description, userId);

    return updated;
  }

  async preview(releaseId: string) {
    const release = await this.prisma.newsRelease.findUniqueOrThrow({
      where: { id: releaseId },
      include: {
        ministry: true,
        documents: {
          orderBy: { sortIndex: 'asc' },
          include: {
            languages: true,
            contacts: { orderBy: { sortIndex: 'asc' } },
          },
        },
        languages: true,
      },
    });

    return {
      html: this.generation.generateHtml(release),
      txt: this.generation.generateTxt(release),
    };
  }

  private log(releaseId: string, description: string, userId?: string) {
    return this.prisma.newsReleaseLog.create({
      data: { releaseId, description, userId },
    });
  }
}

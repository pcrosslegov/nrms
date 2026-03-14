import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GenerationService } from '../generation/generation.service';
import { EmailService } from './email.service';

@Injectable()
export class NodService {
  private readonly logger = new Logger(NodService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private generation: GenerationService,
    private email: EmailService,
  ) {}

  async publishToSubscribers(releaseId: string): Promise<number> {
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
        distributions: { include: { mediaDistribution: true } },
      },
    });

    if (!release.publishToNewsOnDemand) {
      this.logger.debug(`Release ${release.reference} not flagged for NewsOnDemand`);
      return 0;
    }

    // In production, this would query a subscriber database
    // For now, log that it would be sent
    const headline = release.documents[0]?.languages?.find(
      (l) => l.languageId === 'en',
    )?.headline ?? release.reference;

    const html = this.generation.generateHtml(release);
    const txt = this.generation.generateTxt(release);

    this.logger.log(
      `NewsOnDemand: Would distribute "${headline}" (${release.reference}) to subscribers`,
    );

    // Update subscriber count on the release
    // In production this would be the actual count from the NOD system
    const subscriberCount = 0;
    await this.prisma.newsRelease.update({
      where: { id: releaseId },
      data: { nodSubscribers: subscriberCount },
    });

    return subscriberCount;
  }
}

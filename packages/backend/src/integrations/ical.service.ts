import { Injectable } from '@nestjs/common';
import ical, { ICalCalendarMethod } from 'ical-generator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ICalService {
  constructor(private prisma: PrismaService) {}

  async generateFeed(daysAhead = 30): Promise<string> {
    const now = new Date();
    const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const releases = await this.prisma.newsRelease.findMany({
      where: {
        isActive: true,
        isCommitted: true,
        releaseDateTime: { gte: now, lte: until },
      },
      include: {
        ministry: true,
        documents: {
          take: 1,
          orderBy: { sortIndex: 'asc' },
          include: {
            languages: { where: { languageId: 'en' }, take: 1 },
          },
        },
        languages: { where: { languageId: 'en' }, take: 1 },
      },
      orderBy: { releaseDateTime: 'asc' },
    });

    const calendar = ical({
      name: 'NRMS News Release Forecast',
      method: ICalCalendarMethod.PUBLISH,
      prodId: '//NRMS//News Releases//EN',
    });

    for (const release of releases) {
      const headline =
        release.documents[0]?.languages[0]?.headline ?? release.reference;
      const summary = release.languages[0]?.summary ?? '';
      const location = release.languages[0]?.location ?? '';

      const start = release.releaseDateTime!;
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

      calendar.createEvent({
        start,
        end,
        summary: `${release.reference}: ${headline}`,
        description: summary,
        location,
        url: release.reference
          ? `https://news.gov.nb.ca/${release.key}`
          : undefined,
        categories: release.ministry
          ? [{ name: release.ministry.displayName }]
          : [],
      });
    }

    return calendar.toString();
  }
}

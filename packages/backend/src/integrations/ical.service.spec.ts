import { Test, TestingModule } from '@nestjs/testing';
import { ICalService } from './ical.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ICalService', () => {
  let service: ICalService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      newsRelease: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ICalService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ICalService>(ICalService);
  });

  it('should generate a valid iCal feed with no events', async () => {
    const feed = await service.generateFeed();
    expect(feed).toContain('BEGIN:VCALENDAR');
    expect(feed).toContain('PRODID:-//NRMS//News Releases//EN');
    expect(feed).toContain('END:VCALENDAR');
  });

  it('should include events for scheduled releases', async () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    prisma.newsRelease.findMany.mockResolvedValue([
      {
        id: 'r-1',
        reference: 'NEWS-00001',
        key: '2026DH0001-000001',
        releaseDateTime: future,
        ministry: { displayName: 'Dept of Health' },
        documents: [{ languages: [{ headline: 'Health Update' }] }],
        languages: [{ summary: 'A summary', location: 'Fredericton' }],
      },
    ]);

    const feed = await service.generateFeed();
    expect(feed).toContain('NEWS-00001');
    expect(feed).toContain('Health Update');
    expect(feed).toContain('BEGIN:VEVENT');
  });
});

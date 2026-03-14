import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(releaseId: string, description: string, userId?: string) {
    return this.prisma.newsReleaseLog.create({
      data: { releaseId, description, userId },
    });
  }

  async getLogsForRelease(releaseId: string, take = 100) {
    return this.prisma.newsReleaseLog.findMany({
      where: { releaseId },
      orderBy: { dateTime: 'desc' },
      take,
    });
  }
}

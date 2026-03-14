import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowService } from './workflow.service';

@Injectable()
export class PublishCronService {
  private readonly logger = new Logger(PublishCronService.name);
  private running = false;

  constructor(
    private prisma: PrismaService,
    private workflow: WorkflowService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePublishCron() {
    if (this.running) return;
    this.running = true;

    try {
      // Find all committed but unpublished releases whose publish time has passed
      const due = await this.prisma.newsRelease.findMany({
        where: {
          isCommitted: true,
          isPublished: false,
          isActive: true,
          publishDateTime: { lte: new Date() },
        },
      });

      if (due.length === 0) {
        return;
      }

      this.logger.log(`Publishing ${due.length} scheduled release(s)`);

      for (const release of due) {
        try {
          await this.workflow.publish(release.id);
          this.logger.log(`Published: ${release.reference} (${release.id})`);
        } catch (err) {
          this.logger.error(
            `Failed to publish ${release.reference}: ${err.message}`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}

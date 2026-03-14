import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ICalService } from './ical.service';

@Controller('feed')
export class ICalController {
  constructor(private ical: ICalService) {}

  @Get('ical')
  async getFeed(@Query('days') days: string, @Res() res: Response) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    const feed = await this.ical.generateFeed(daysAhead);
    res.type('text/calendar').send(feed);
  }
}

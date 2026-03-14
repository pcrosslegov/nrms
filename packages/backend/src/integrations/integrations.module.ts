import { Module } from '@nestjs/common';
import { ICalService } from './ical.service';
import { ICalController } from './ical.controller';
import { FlickrService } from './flickr.service';
import { EmailService } from './email.service';
import { NodService } from './nod.service';
import { GenerationModule } from '../generation/generation.module';

@Module({
  imports: [GenerationModule],
  controllers: [ICalController],
  providers: [ICalService, FlickrService, EmailService, NodService],
  exports: [FlickrService, EmailService, NodService, ICalService],
})
export class IntegrationsModule {}

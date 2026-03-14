import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FlickrService {
  private readonly logger = new Logger(FlickrService.name);
  private readonly apiKey: string | undefined;
  private readonly apiSecret: string | undefined;

  constructor(private config: ConfigService) {
    this.apiKey = config.get('FLICKR_API_KEY');
    this.apiSecret = config.get('FLICKR_API_SECRET');
  }

  get isConfigured(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }

  async setPhotoPublic(photoId: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('Flickr not configured — skipping setPhotoPublic');
      return;
    }
    this.logger.log(`Would set Flickr photo ${photoId} to public`);
    // TODO: Implement OAuth + flickr.photos.setPerms API call
  }

  async setPhotoPrivate(photoId: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('Flickr not configured — skipping setPhotoPrivate');
      return;
    }
    this.logger.log(`Would set Flickr photo ${photoId} to private`);
    // TODO: Implement OAuth + flickr.photos.setPerms API call
  }
}

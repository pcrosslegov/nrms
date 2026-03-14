import { Module } from '@nestjs/common';
import { ReleasesController } from './releases.controller';
import { ReleasesService } from './releases.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  controllers: [ReleasesController, SearchController],
  providers: [ReleasesService, SearchService],
  exports: [ReleasesService, SearchService],
})
export class ReleasesModule {}

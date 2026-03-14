import { Module } from '@nestjs/common';
import { MinistriesController } from './ministries.controller';
import { SectorsController } from './sectors.controller';
import { ThemesController } from './themes.controller';
import { TagsController } from './tags.controller';
import { ReferenceDataService } from './reference-data.service';

@Module({
  controllers: [
    MinistriesController,
    SectorsController,
    ThemesController,
    TagsController,
  ],
  providers: [ReferenceDataService],
  exports: [ReferenceDataService],
})
export class ReferenceDataModule {}
